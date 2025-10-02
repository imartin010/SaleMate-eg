import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download } from 'lucide-react';

interface Agent {
  name: string;
  score: number;
  metrics: {
    transactionsValue: number; // % achieved from target
    meetingsRatio: number; // % scheduled meetings from calls
    pipelineToTarget: number; // % pipeline to target
    qualitativeFeedback: number; // Adherence and time management (1-10 scale)
  };
}

interface AgentCategory {
  name: string;
  emoji: string;
  color: string;
  bgColor: string;
  textColor: string;
  minScore: number;
  maxScore?: number;
  privileges: string[];
  agents: Agent[];
}

const AgentScoringPage: React.FC = () => {
  const pdfRef = useRef<HTMLDivElement>(null);
  // Calculate overall score based on metrics
  const calculateScore = (metrics: Agent['metrics']): number => {
    const weights = {
      transactionsValue: 0.3, // 30%
      meetingsRatio: 0.25,   // 25%
      pipelineToTarget: 0.25, // 25%
      qualitativeFeedback: 0.2 // 20%
    };
    
    return Math.round(
      (metrics.transactionsValue * weights.transactionsValue) +
      (metrics.meetingsRatio * weights.meetingsRatio) +
      (metrics.pipelineToTarget * weights.pipelineToTarget) +
      (metrics.qualitativeFeedback * 10 * weights.qualitativeFeedback) // Convert 1-10 scale to percentage
    );
  };

  // Mock data with detailed metrics
  const agents: Agent[] = [
    { 
      name: "Ahmed", 
      score: 0, // Will be calculated
      metrics: {
        transactionsValue: 90, // 90% of target achieved
        meetingsRatio: 75,     // 75% of calls resulted in meetings
        pipelineToTarget: 85,  // 85% of pipeline target
        qualitativeFeedback: 8  // 8/10 for adherence and time management
      }
    },
    { 
      name: "Mona", 
      score: 0,
      metrics: {
        transactionsValue: 70,
        meetingsRatio: 65,
        pipelineToTarget: 75,
        qualitativeFeedback: 7
      }
    },
    { 
      name: "Omar", 
      score: 0,
      metrics: {
        transactionsValue: 40,
        meetingsRatio: 35,
        pipelineToTarget: 50,
        qualitativeFeedback: 4
      }
    },
    { 
      name: "Sara", 
      score: 0,
      metrics: {
        transactionsValue: 95,
        meetingsRatio: 85,
        pipelineToTarget: 90,
        qualitativeFeedback: 9
      }
    },
    { 
      name: "Ali", 
      score: 0,
      metrics: {
        transactionsValue: 50,
        meetingsRatio: 60,
        pipelineToTarget: 55,
        qualitativeFeedback: 5
      }
    },
    { 
      name: "Fatima", 
      score: 0,
      metrics: {
        transactionsValue: 100,
        meetingsRatio: 90,
        pipelineToTarget: 95,
        qualitativeFeedback: 10
      }
    },
    { 
      name: "Hassan", 
      score: 0,
      metrics: {
        transactionsValue: 30,
        meetingsRatio: 25,
        pipelineToTarget: 40,
        qualitativeFeedback: 3
      }
    },
    { 
      name: "Layla", 
      score: 0,
      metrics: {
        transactionsValue: 65,
        meetingsRatio: 70,
        pipelineToTarget: 68,
        qualitativeFeedback: 6
      }
    },
    { 
      name: "Youssef", 
      score: 0,
      metrics: {
        transactionsValue: 85,
        meetingsRatio: 80,
        pipelineToTarget: 82,
        qualitativeFeedback: 8
      }
    },
    { 
      name: "Nour", 
      score: 0,
      metrics: {
        transactionsValue: 25,
        meetingsRatio: 20,
        pipelineToTarget: 30,
        qualitativeFeedback: 2
      }
    }
  ];

  // Calculate scores for all agents
  const agentsWithScores = agents.map(agent => ({
    ...agent,
    score: calculateScore(agent.metrics)
  }));

  // Categorize agents based on score
  const categorizeAgents = (agents: Agent[]): AgentCategory[] => {
    const support = agents.filter(agent => agent.score >= 80);
    const paidProbation = agents.filter(agent => agent.score >= 50 && agent.score < 80);
    const unpaidProbation = agents.filter(agent => agent.score < 50);

    return [
      {
        name: "Support",
        emoji: "🟢",
        color: "green",
        bgColor: "bg-green-50",
        textColor: "text-green-800",
        minScore: 80,
        privileges: ["Leads", "High Qualified Data", "CILs"],
        agents: support
      },
      {
        name: "Paid Probation",
        emoji: "🟡",
        color: "yellow",
        bgColor: "bg-yellow-50",
        textColor: "text-yellow-800",
        minScore: 50,
        maxScore: 79,
        privileges: ["Limited Access (Paid)"],
        agents: paidProbation
      },
      {
        name: "Unpaid Probation",
        emoji: "🔴",
        color: "red",
        bgColor: "bg-red-50",
        textColor: "text-red-800",
        minScore: 0,
        maxScore: 49,
        privileges: ["No Access (Unpaid)"],
        agents: unpaidProbation
      }
    ];
  };

  const categories = categorizeAgents(agentsWithScores);

  const downloadPDF = async () => {
    if (!pdfRef.current) {
      alert('Content not ready for export. Please try again.');
      return;
    }

    try {
      // Show loading state
      const button = document.querySelector('[data-pdf-button]') as HTMLButtonElement;
      if (button) {
        button.disabled = true;
        button.textContent = 'Generating PDF...';
      }

      // Wait a bit for any animations to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create a comprehensive style override to handle all possible color formats
      const tempStyle = document.createElement('style');
      tempStyle.textContent = `
        .pdf-export * {
          color: rgb(0, 0, 0) !important;
          background-color: rgb(255, 255, 255) !important;
          border-color: rgb(209, 213, 219) !important;
        }
        
        /* Override all TailwindCSS color classes with RGB equivalents */
        .pdf-export .bg-blue-50 { background-color: rgb(239, 246, 255) !important; }
        .pdf-export .bg-blue-100 { background-color: rgb(219, 234, 254) !important; }
        .pdf-export .bg-purple-50 { background-color: rgb(250, 245, 255) !important; }
        .pdf-export .bg-orange-50 { background-color: rgb(255, 247, 237) !important; }
        .pdf-export .bg-green-50 { background-color: rgb(240, 253, 244) !important; }
        .pdf-export .bg-green-100 { background-color: rgb(220, 252, 231) !important; }
        .pdf-export .bg-yellow-50 { background-color: rgb(254, 252, 232) !important; }
        .pdf-export .bg-yellow-100 { background-color: rgb(254, 249, 195) !important; }
        .pdf-export .bg-red-50 { background-color: rgb(254, 242, 242) !important; }
        .pdf-export .bg-red-100 { background-color: rgb(254, 226, 226) !important; }
        .pdf-export .bg-gray-50 { background-color: rgb(249, 250, 251) !important; }
        .pdf-export .bg-gray-100 { background-color: rgb(243, 244, 246) !important; }
        .pdf-export .bg-white { background-color: rgb(255, 255, 255) !important; }
        
        .pdf-export .text-blue-600 { color: rgb(37, 99, 235) !important; }
        .pdf-export .text-blue-700 { color: rgb(29, 78, 216) !important; }
        .pdf-export .text-blue-800 { color: rgb(30, 64, 175) !important; }
        .pdf-export .text-blue-900 { color: rgb(30, 58, 138) !important; }
        .pdf-export .text-purple-600 { color: rgb(147, 51, 234) !important; }
        .pdf-export .text-purple-700 { color: rgb(126, 34, 206) !important; }
        .pdf-export .text-purple-800 { color: rgb(109, 40, 217) !important; }
        .pdf-export .text-purple-900 { color: rgb(88, 28, 135) !important; }
        .pdf-export .text-orange-600 { color: rgb(234, 88, 12) !important; }
        .pdf-export .text-orange-700 { color: rgb(194, 65, 12) !important; }
        .pdf-export .text-orange-800 { color: rgb(154, 52, 18) !important; }
        .pdf-export .text-orange-900 { color: rgb(124, 45, 18) !important; }
        .pdf-export .text-green-600 { color: rgb(34, 197, 94) !important; }
        .pdf-export .text-green-700 { color: rgb(21, 128, 61) !important; }
        .pdf-export .text-green-800 { color: rgb(22, 101, 52) !important; }
        .pdf-export .text-green-900 { color: rgb(20, 83, 45) !important; }
        .pdf-export .text-yellow-600 { color: rgb(202, 138, 4) !important; }
        .pdf-export .text-yellow-700 { color: rgb(161, 98, 7) !important; }
        .pdf-export .text-yellow-800 { color: rgb(133, 77, 14) !important; }
        .pdf-export .text-red-600 { color: rgb(220, 38, 38) !important; }
        .pdf-export .text-red-700 { color: rgb(185, 28, 28) !important; }
        .pdf-export .text-red-800 { color: rgb(153, 27, 27) !important; }
        .pdf-export .text-gray-600 { color: rgb(75, 85, 99) !important; }
        .pdf-export .text-gray-700 { color: rgb(55, 65, 81) !important; }
        .pdf-export .text-gray-800 { color: rgb(31, 41, 55) !important; }
        .pdf-export .text-gray-900 { color: rgb(17, 24, 39) !important; }
        .pdf-export .text-white { color: rgb(255, 255, 255) !important; }
        
        /* Force all elements to use RGB colors only */
        .pdf-export * {
          color: rgb(0, 0, 0) !important;
        }
        .pdf-export h1, .pdf-export h2, .pdf-export h3, .pdf-export h4 {
          color: rgb(17, 24, 39) !important;
        }
        .pdf-export p, .pdf-export span, .pdf-export div {
          color: rgb(55, 65, 81) !important;
        }
      `;
      document.head.appendChild(tempStyle);
      
      // Add PDF export class to the content
      pdfRef.current.classList.add('pdf-export');
      
      // Force a re-render to apply the styles
      void pdfRef.current.offsetHeight;

      // Create canvas from the content with options that avoid color parsing issues
      const canvas = await html2canvas(pdfRef.current, {
        scale: 1,
        useCORS: false,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: pdfRef.current.offsetWidth,
        height: pdfRef.current.offsetHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        ignoreElements: (element) => {
          // Skip elements that might have problematic styles
          const htmlElement = element as HTMLElement;
          return element.classList.contains('ignore-pdf') || 
                 htmlElement.style.color?.includes('oklch') ||
                 htmlElement.style.backgroundColor?.includes('oklch');
        },
        onclone: (clonedDoc) => {
          // Additional cleanup on the cloned document
          const clonedElements = clonedDoc.querySelectorAll('*');
          clonedElements.forEach((el) => {
            const htmlElement = el as HTMLElement;
            if (htmlElement.style) {
              // Remove any oklch color functions
              if (htmlElement.style.color?.includes('oklch')) {
                htmlElement.style.color = 'rgb(0, 0, 0)';
              }
              if (htmlElement.style.backgroundColor?.includes('oklch')) {
                htmlElement.style.backgroundColor = 'rgb(255, 255, 255)';
              }
              if (htmlElement.style.borderColor?.includes('oklch')) {
                htmlElement.style.borderColor = 'rgb(209, 213, 219)';
              }
            }
          });
        }
      });

      if (!canvas) {
        throw new Error('Failed to capture content');
      }

      // Create PDF with better settings
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add the image to PDF
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      // Check if image is valid
      if (!imgData || imgData === 'data:,') {
        throw new Error('Failed to generate image data');
      }
      
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

      // Add title and date to the PDF
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Agent Scoring Report', 20, 20);
      
      const currentDate = new Date().toLocaleDateString();
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on: ${currentDate}`, 20, 30);

      // Download the PDF
      pdf.save(`agent-scoring-report-${new Date().toISOString().split('T')[0]}.pdf`);
      
      // Cleanup: Remove temporary styles and class
      document.head.removeChild(tempStyle);
      pdfRef.current.classList.remove('pdf-export');
      
      // Reset button
      if (button) {
        button.disabled = false;
        button.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> Export PDF';
      }
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      
      // Cleanup on error
      try {
        const tempStyle = document.querySelector('style');
        if (tempStyle && tempStyle.textContent?.includes('pdf-export')) {
          document.head.removeChild(tempStyle);
        }
        if (pdfRef.current) {
          pdfRef.current.classList.remove('pdf-export');
        }
      } catch (cleanupError) {
        console.warn('Error during cleanup:', cleanupError);
      }
      
      // Reset button on error
      const button = document.querySelector('[data-pdf-button]') as HTMLButtonElement;
      if (button) {
        button.disabled = false;
        button.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> Export PDF';
      }
      
      alert(`Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <div></div>
            <h1 className="text-3xl font-bold text-gray-900">
              Agent Scoring System
            </h1>
            <button
              onClick={downloadPDF}
              data-pdf-button
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Track agent performance and access levels based on their scoring metrics. 
            Agents are categorized into three tiers with different privileges and access levels.
          </p>
        </div>

        {/* PDF Content - Wrapped for export */}
        <div ref={pdfRef} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200" style={{ minHeight: '800px' }}>
          {/* Metrics Explanation - Above the cards */}
          <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">How Your Score is Calculated</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">30%</div>
              <h3 className="font-semibold text-blue-900 mb-2">Transactions Value</h3>
              <p className="text-sm text-blue-700">
                Percentage of target transactions value you achieved
              </p>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600 mb-2">25%</div>
              <h3 className="font-semibold text-purple-900 mb-2">Meetings Ratio</h3>
              <p className="text-sm text-purple-700">
                Percentage of your calls that resulted in scheduled meetings
              </p>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-600 mb-2">25%</div>
              <h3 className="font-semibold text-orange-900 mb-2">Pipeline to Target</h3>
              <p className="text-sm text-orange-700">
                Your pipeline progress towards target goals
              </p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">20%</div>
              <h3 className="font-semibold text-green-900 mb-2">Manager Feedback</h3>
              <p className="text-sm text-green-700">
                Manager rating for adherence and time management (1-10 scale)
              </p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 text-center">
              <strong>Your overall score determines your access level:</strong> Support (80%+), Paid Probation (50-79%), or Unpaid Probation (under 50%)
            </p>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div
              key={category.name}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* Category Header */}
              <div className={`${category.bgColor} px-6 py-4 border-b border-gray-200`}>
                <div className="flex items-center justify-between">
                  <h2 className={`text-xl font-semibold ${category.textColor}`}>
                    {category.emoji} {category.name}
                  </h2>
                  <span className={`text-sm font-medium ${category.textColor}`}>
                    {category.agents.length} agent{category.agents.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="mt-2">
                  <span className={`text-sm ${category.textColor}`}>
                    Score: {category.minScore}+
                    {category.maxScore && ` - ${category.maxScore}`}
                  </span>
                </div>
              </div>

              {/* Privileges */}
              <div className="px-6 py-4 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Privileges:</h3>
                <ul className="space-y-1">
                  {category.privileges.map((privilege, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-center">
                      <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                      {privilege}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Agents List */}
              <div className="px-6 py-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Agents:</h3>
                {category.agents.length > 0 ? (
                  <div className="space-y-4">
                    {category.agents.map((agent, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-lg border border-gray-200 p-4"
                      >
                        {/* Agent Header */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-gray-900">{agent.name}</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            category.color === 'green' ? 'bg-green-100 text-green-800' :
                            category.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            Overall: {agent.score}%
                          </span>
                        </div>
                        
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-gray-50 rounded-md p-3">
                            <div className="text-xs text-gray-600 mb-1">Transactions Value</div>
                            <div className="text-sm font-medium text-gray-900">
                              {agent.metrics.transactionsValue}%
                            </div>
                            <div className="text-xs text-gray-500">Target Achievement</div>
                          </div>
                          
                          <div className="bg-gray-50 rounded-md p-3">
                            <div className="text-xs text-gray-600 mb-1">Meetings Ratio</div>
                            <div className="text-sm font-medium text-gray-900">
                              {agent.metrics.meetingsRatio}%
                            </div>
                            <div className="text-xs text-gray-500">Calls to Meetings</div>
                          </div>
                          
                          <div className="bg-gray-50 rounded-md p-3">
                            <div className="text-xs text-gray-600 mb-1">Pipeline to Target</div>
                            <div className="text-sm font-medium text-gray-900">
                              {agent.metrics.pipelineToTarget}%
                            </div>
                            <div className="text-xs text-gray-500">Pipeline Progress</div>
                          </div>
                          
                          <div className="bg-gray-50 rounded-md p-3">
                            <div className="text-xs text-gray-600 mb-1">Qualitative Feedback</div>
                            <div className="text-sm font-medium text-gray-900">
                              {agent.metrics.qualitativeFeedback}/10
                            </div>
                            <div className="text-xs text-gray-500">Manager Rating</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No agents in this category</p>
                )}
              </div>
            </div>
          ))}
        </div>


          {/* Summary Stats */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {categories.map((category) => (
                <div key={category.name} className="text-center">
                  <div className={`text-2xl font-bold ${category.textColor}`}>
                    {category.agents.length}
                  </div>
                  <div className="text-sm text-gray-600">{category.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentScoringPage;
