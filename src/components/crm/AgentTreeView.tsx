import React, { useState, useEffect, useRef } from 'react';
import { Search, Users, User, ChevronDown, ChevronRight, GripVertical, AlertCircle } from 'lucide-react';
import { getAgentTree, getTeamTreeStats, assignManager } from '../../services/agentService';
import type { AgentTreeNode, TeamTreeStats } from '../../services/agentService';
import { useAuthStore } from '../../store/auth';
import { AssignManagerDialog } from './AssignManagerDialog';
import { supabase } from '../../lib/supabaseClient';

interface AgentTreeViewProps {
  rootUserId?: string;
  onUserSelect?: (userId: string) => void;
}

interface TreeNode extends AgentTreeNode {
  children?: TreeNode[];
  expanded?: boolean;
}

export const AgentTreeView: React.FC<AgentTreeViewProps> = ({
  rootUserId,
  onUserSelect,
}) => {
  const { profile } = useAuthStore();
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [flatTree, setFlatTree] = useState<AgentTreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [stats, setStats] = useState<TeamTreeStats | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignDialogUserId, setAssignDialogUserId] = useState<string | null>(null);
  const [draggedUserId, setDraggedUserId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const effectiveRootId = rootUserId || profile?.id || '';

  useEffect(() => {
    loadTree();
  }, [rootUserId]);

  useEffect(() => {
    if (selectedUserId) {
      loadStats(selectedUserId);
    }
  }, [selectedUserId]);

  const loadTree = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // If rootUserId is specified, show tree from that user
      // Otherwise, show all users in a tree structure
      if (rootUserId) {
        const tree = await getAgentTree(rootUserId);
        setFlatTree(tree);
        const hierarchical = buildTree(tree);
        setTreeData(hierarchical);
      } else {
        // Load all users and build complete tree structure
        const { data: allUsers, error: err } = await supabase
          .from('profiles')
          .select('id, name, email, phone, role, manager_id')
          .order('name');

        if (err) throw err;

        // Convert to AgentTreeNode format
        const allNodes: AgentTreeNode[] = (allUsers || []).map((user, index) => ({
          user_id: user.id,
          user_name: user.name,
          user_email: user.email,
          user_phone: user.phone,
          user_role: user.role,
          manager_id: user.manager_id,
          depth: 0, // Will be calculated in buildTree
        }));

        setFlatTree(allNodes);
        const hierarchical = buildCompleteTree(allNodes);
        setTreeData(hierarchical);
      }
    } catch (err) {
      console.error('Error loading tree:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tree');
    } finally {
      setLoading(false);
    }
  };

  const buildTree = (nodes: AgentTreeNode[]): TreeNode[] => {
    if (nodes.length === 0) return [];
    
    const nodeMap = new Map<string, TreeNode>();
    const rootNode = nodes.find(n => n.depth === 0);
    
    if (!rootNode) return [];

    // Create node map
    nodes.forEach(node => {
      nodeMap.set(node.user_id, {
        ...node,
        children: [],
        expanded: node.depth <= 1, // Expand first two levels by default
      });
    });

    // Build tree structure - find root and build from there
    const root = nodeMap.get(rootNode.user_id)!;
    const buildChildren = (parentId: string): TreeNode[] => {
      return nodes
        .filter(node => node.manager_id === parentId)
        .map(node => {
          const treeNode = nodeMap.get(node.user_id)!;
          treeNode.children = buildChildren(node.user_id);
          return treeNode;
        });
    };

    root.children = buildChildren(rootNode.user_id);
    return [root];
  };

  const buildCompleteTree = (nodes: AgentTreeNode[]): TreeNode[] => {
    if (nodes.length === 0) return [];

    const nodeMap = new Map<string, TreeNode>();
    
    // Create node map with all nodes
    nodes.forEach(node => {
      nodeMap.set(node.user_id, {
        ...node,
        children: [],
        expanded: true, // Expand all by default for complete tree view
      });
    });

    // Find all root nodes (users without managers)
    const rootNodes: TreeNode[] = [];
    const childrenMap = new Map<string, TreeNode[]>();

    // Build children map
    nodes.forEach(node => {
      if (node.manager_id) {
        if (!childrenMap.has(node.manager_id)) {
          childrenMap.set(node.manager_id, []);
        }
        const treeNode = nodeMap.get(node.user_id)!;
        childrenMap.get(node.manager_id)!.push(treeNode);
      } else {
        // This is a root node (no manager)
        rootNodes.push(nodeMap.get(node.user_id)!);
      }
    });

    // Recursively set children
    const setChildren = (node: TreeNode) => {
      const children = childrenMap.get(node.user_id) || [];
      node.children = children.map(child => {
        setChildren(child);
        return child;
      });
    };

    rootNodes.forEach(root => setChildren(root));
    return rootNodes;
  };

  const loadStats = async (userId: string) => {
    try {
      const treeStats = await getTeamTreeStats(userId);
      setStats(treeStats);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const toggleExpand = (userId: string) => {
    const updateNode = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.map(node => {
        if (node.user_id === userId) {
          return { ...node, expanded: !node.expanded };
        }
        if (node.children) {
          return { ...node, children: updateNode(node.children) };
        }
        return node;
      });
    };
    setTreeData(updateNode(treeData));
  };

  const handleDragStart = (e: React.DragEvent, userId: string) => {
    setDraggedUserId(userId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', userId);
  };

  const handleDragOver = (e: React.DragEvent, userId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedUserId && draggedUserId !== userId) {
      setDropTargetId(userId);
    }
  };

  const handleDragLeave = () => {
    setDropTargetId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetUserId: string) => {
    e.preventDefault();
    setDropTargetId(null);

    if (!draggedUserId || draggedUserId === targetUserId || !profile) {
      setDraggedUserId(null);
      return;
    }

    try {
      const result = await assignManager(draggedUserId, targetUserId, profile.id);
      if (result.success) {
        await loadTree();
        if (result.tree_preserved && result.direct_reports_count && result.direct_reports_count > 0) {
          // Tree is preserved, just show info
          console.log(`Manager assigned. ${result.direct_reports_count} direct report(s) remain under this manager.`);
        }
      } else {
        alert(result.error || 'Failed to assign manager');
      }
    } catch (err) {
      console.error('Error assigning manager via drag-drop:', err);
      alert('Failed to assign manager');
    } finally {
      setDraggedUserId(null);
    }
  };

  const handleAssignClick = (userId: string) => {
    setAssignDialogUserId(userId);
    setShowAssignDialog(true);
  };

  const filteredTree = searchTerm
    ? flatTree.filter(
        node =>
          node.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          node.user_email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const renderNode = (node: TreeNode, level: number = 0): React.ReactNode => {
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedUserId === node.user_id;
    const isDragging = draggedUserId === node.user_id;
    const isDropTarget = dropTargetId === node.user_id;

    return (
      <div key={node.user_id} className="relative">
        <div
          className={`flex items-center gap-2 p-3 rounded-lg mb-2 transition-all ${
            isSelected
              ? 'bg-blue-100 border-2 border-blue-500'
              : isDropTarget
              ? 'bg-green-100 border-2 border-green-500'
              : 'bg-white border border-gray-200 hover:border-gray-300'
          } ${isDragging ? 'opacity-50' : ''}`}
          style={{ marginLeft: `${level * 24}px` }}
          draggable={!isDragging}
          onDragStart={(e) => handleDragStart(e, node.user_id)}
          onDragOver={(e) => handleDragOver(e, node.user_id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, node.user_id)}
          onClick={() => {
            setSelectedUserId(node.user_id);
            onUserSelect?.(node.user_id);
          }}
        >
          {/* Expand/Collapse Button */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node.user_id);
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {node.expanded ? (
                <ChevronDown className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-600" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}

          {/* Drag Handle */}
          <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />

          {/* User Avatar */}
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
            {node.user_name.charAt(0).toUpperCase()}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-gray-900 truncate">{node.user_name}</p>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                node.user_role === 'admin' ? 'bg-purple-100 text-purple-800' :
                node.user_role === 'manager' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {node.user_role}
              </span>
            </div>
            <p className="text-sm text-gray-600 truncate">{node.user_email}</p>
            {node.children && node.children.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {node.children.length} direct report{node.children.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAssignClick(node.user_id);
              }}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Assign Manager
            </button>
          </div>
        </div>

        {/* Children */}
        {hasChildren && node.expanded && (
          <div className="ml-6 border-l-2 border-gray-200 pl-2">
            {node.children!.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users in tree..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Stats Panel */}
        {stats && selectedUserId && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2">Tree Statistics</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-lg font-semibold text-gray-900">{stats.total_users}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Direct Reports</p>
                <p className="text-lg font-semibold text-gray-900">{stats.direct_reports}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Owned Leads</p>
                <p className="text-lg font-semibold text-gray-900">{stats.owned_leads}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Assigned Leads</p>
                <p className="text-lg font-semibold text-gray-900">{stats.assigned_leads}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Max Depth</p>
                <p className="text-lg font-semibold text-gray-900">{stats.max_depth}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tree View */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-50 p-4 rounded-lg"
        style={{ minHeight: '400px' }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-600">Loading tree...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        ) : searchTerm ? (
          <div className="space-y-2">
            {filteredTree.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No users found matching "{searchTerm}"</p>
            ) : (
              filteredTree.map(node => (
                <div
                  key={node.user_id}
                  className="p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 cursor-pointer"
                  onClick={() => {
                    setSelectedUserId(node.user_id);
                    onUserSelect?.(node.user_id);
                  }}
                >
                  <p className="font-medium text-gray-900">{node.user_name}</p>
                  <p className="text-sm text-gray-600">{node.user_email}</p>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {treeData.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No tree data available</p>
            ) : (
              treeData.map(node => renderNode(node))
            )}
          </div>
        )}
      </div>

      {/* Drag and Drop Instructions */}
      {!searchTerm && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Drag a user card and drop it on another user to assign them as manager.
          </p>
        </div>
      )}

      {/* Assign Manager Dialog */}
      {showAssignDialog && assignDialogUserId && (
        <AssignManagerDialog
          userIds={[assignDialogUserId]}
          onClose={() => {
            setShowAssignDialog(false);
            setAssignDialogUserId(null);
          }}
          onSuccess={() => {
            loadTree();
            setShowAssignDialog(false);
            setAssignDialogUserId(null);
          }}
        />
      )}
    </div>
  );
};

