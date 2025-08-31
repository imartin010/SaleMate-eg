import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useProjectStore } from '../../store/projects';
import { 
  Search, 
  ExternalLink,
  TrendingUp,
  Award,
  Users,
  Target,
  Shield,
  CheckCircle,
  Filter,
  Eye,
  BarChart3,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Globe as GlobeIcon
} from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  logo: string;
  commissionRate: number;
  description: string;
  specialties: string[];
  website: string;
  contactEmail?: string;
  contactPhone?: string;
  location?: string;
  established?: string;
  projectsCount?: number;
  successRate?: number;
}

// Enhanced partner data with more details
const PARTNERS: Partner[] = [
  {
    id: 'nawy',
    name: 'Nawy',
    logo: 'partners-logos/nawy-partners.png',
    commissionRate: 2.8,
    description: 'Egypt\'s leading proptech platform connecting buyers with verified properties.',
    specialties: ['Residential', 'Luxury', 'Verified Properties', 'Digital Platform'],
    website: 'https://nawy.com',
    contactEmail: 'partners@nawy.com',
    contactPhone: '+20 2 1234 5678',
    location: 'Cairo, Egypt',
    established: '2018',
    projectsCount: 150,
    successRate: 94
  },
  {
    id: 'bold-routes',
    name: 'Bold Routes',
    logo: 'partners-logos/bold-routes-logo.png',
    commissionRate: 3.0,
    description: 'Innovative property solutions focusing on smart investments and modern living.',
    specialties: ['Smart Investments', 'Modern Living', 'Innovation', 'Premium Service'],
    website: 'https://boldroutes.com',
    contactEmail: 'partnerships@boldroutes.com',
    contactPhone: '+20 2 1234 5679',
    location: 'New Cairo, Egypt',
    established: '2020',
    projectsCount: 89,
    successRate: 91
  },
  {
    id: 'cb-link',
    name: 'CB Link by Coldwell Banker',
    logo: 'partners-logos/coldwell-banker-logo.png',
    commissionRate: 4.0,
    description: 'CB Link by Coldwell Banker - Global real estate brand with extensive market reach and premium service.',
    specialties: ['Global Brand', 'Premium Service', 'Market Reach', 'International'],
    website: 'https://cblink.com',
    contactEmail: 'egypt@cblink.com',
    contactPhone: '+20 2 1234 5680',
    location: 'Multiple Cities, Egypt',
    established: '2015',
    projectsCount: 234,
    successRate: 96
  },
  {
    id: 'the-address',
    name: 'The Address Investments',
    logo: 'partners-logos/the-address-investments-logo.png',
    commissionRate: 3.5,
    description: 'Leading real estate investment firm specializing in premium properties across Egypt.',
    specialties: ['Premium Properties', 'Investment', 'Luxury', 'High-End'],
    website: 'https://address-investments.com',
    contactEmail: 'partners@address-investments.com',
    contactPhone: '+20 2 1234 5681',
    location: 'Cairo & Alexandria, Egypt',
    established: '2019',
    projectsCount: 67,
    successRate: 89
  },
  {
    id: 'salemate',
    name: 'SaleMate',
    logo: 'https://wkxbhvckmgrmdkdkhnqo.supabase.co/storage/v1/object/public/partners-logos/sale_mate_logo.png',
    commissionRate: 5.0,
    description: 'Leading real estate platform connecting buyers with verified properties and trusted agents across Egypt.',
    specialties: ['Platform', 'Verified Properties', 'Trusted Agents', 'Nationwide'],
    website: 'https://salemate.com',
    contactEmail: 'partnerships@salemate.com',
    contactPhone: '+20 2 1234 5682',
    location: 'Egypt Wide',
    established: '2022',
    projectsCount: 312,
    successRate: 98
  }
];

export const Partners: React.FC = () => {
  const { fetchProjects } = useProjectStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'commission' | 'success' | 'projects'>('commission');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  React.useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Filter and sort partners
  const filteredAndSortedPartners = PARTNERS
    .filter(partner => 
      partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.specialties.some(specialty => 
        specialty.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    .filter(partner => 
      selectedSpecialty === '' || partner.specialties.includes(selectedSpecialty)
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'commission':
          return b.commissionRate - a.commissionRate;
        case 'success':
          return (b.successRate || 0) - (a.successRate || 0);
        case 'projects':
          return (b.projectsCount || 0) - (a.projectsCount || 0);
        default:
          return 0;
      }
    });

  const allSpecialties = Array.from(
    new Set(PARTNERS.flatMap(partner => partner.specialties))
  ).sort();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative px-6 py-16 mx-auto max-w-7xl">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Strategic Partnerships
            </h1>
            <p className="max-w-3xl mx-auto mt-6 text-xl text-blue-100">
              Connect with Egypt's leading real estate partners. Access premium projects, 
              earn competitive commissions, and grow your business with trusted collaborators.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm">
                <Users className="w-5 h-5" />
                <span className="font-medium">5 Premium Partners</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm">
                <Target className="w-5 h-5" />
                <span className="font-medium">Up to 5% Commission</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm">
                <Shield className="w-5 h-5" />
                <span className="font-medium">Verified & Trusted</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="px-6 py-8 mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search partners, specialties, or descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">All Specialties</option>
                {allSpecialties.map(specialty => (
                  <option key={specialty} value={specialty}>{specialty}</option>
                ))}
              </select>
              
                             <select
                 value={sortBy}
                 onChange={(e) => setSortBy(e.target.value as 'name' | 'commission' | 'success' | 'projects')}
                 className="px-4 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500"
               >
                <option value="commission">Sort by Commission</option>
                <option value="success">Sort by Success Rate</option>
                <option value="projects">Sort by Projects</option>
                <option value="name">Sort by Name</option>
              </select>
              
              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-none"
                >
                  <div className="grid grid-cols-2 gap-1 w-4 h-4">
                    <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                    <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                    <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                    <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                  </div>
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-none"
                >
                  <div className="flex flex-col gap-1 w-4 h-4">
                    <div className="w-full h-1 bg-current rounded-sm"></div>
                    <div className="w-full h-1 bg-current rounded-sm"></div>
                    <div className="w-full h-1 bg-current rounded-sm"></div>
                  </div>
                </Button>
              </div>
            </div>
          </div>
          
          {searchTerm || selectedSpecialty ? (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Filter className="w-4 h-4" />
              <span>
                Showing {filteredAndSortedPartners.length} of {PARTNERS.length} partners
                {searchTerm && ` matching "${searchTerm}"`}
                {selectedSpecialty && ` in ${selectedSpecialty}`}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Partners Grid/List */}
      <div className="px-6 pb-16 mx-auto max-w-7xl">
        {viewMode === 'grid' ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedPartners.map((partner) => (
              <Card 
                key={partner.id} 
                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 bg-white/80 backdrop-blur-sm"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                          {typeof partner.logo === 'string' && (partner.logo.startsWith('partners-logos/') || partner.logo.startsWith('http')) ? (
                            <img 
                              src={partner.logo.startsWith('http') ? partner.logo : `https://wkxbhvckmgrmdkdkhnqo.supabase.co/storage/v1/object/public/${partner.logo}`}
                              alt={`${partner.name} logo`}
                              className="w-12 h-12 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = document.createElement('div');
                                fallback.className = 'w-12 h-12 text-2xl flex items-center justify-center text-blue-600';
                                fallback.innerHTML = '🏢';
                                target.parentNode?.appendChild(fallback);
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 text-2xl flex items-center justify-center text-blue-600">🏢</div>
                          )}
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div>
                        <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                          {partner.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                            {partner.commissionRate}% Commission
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {partner.successRate}% Success
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {partner.description}
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Established</span>
                      <span className="font-medium">{partner.established}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Projects</span>
                      <span className="font-medium">{partner.projectsCount?.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Location</span>
                      <span className="font-medium">{partner.location}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {partner.specialties.slice(0, 3).map((specialty) => (
                      <Badge key={specialty} variant="outline" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                    {partner.specialties.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{partner.specialties.length - 3} more
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 group-hover:border-blue-500 group-hover:text-blue-600"
                      onClick={() => setSelectedPartner(partner)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                                         <a 
                       href={partner.website} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium inline-flex items-center justify-center transition-colors"
                     >
                       <ExternalLink className="w-4 h-4 mr-2" />
                       Visit Website
                     </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedPartners.map((partner) => (
              <Card 
                key={partner.id} 
                className="group hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                        {typeof partner.logo === 'string' && (partner.logo.startsWith('partners-logos/') || partner.logo.startsWith('http')) ? (
                          <img 
                            src={partner.logo.startsWith('http') ? partner.logo : `https://wkxbhvckmgrmdkdkhnqo.supabase.co/storage/v1/object/public/${partner.logo}`}
                            alt={`${partner.name} logo`}
                            className="w-16 h-16 object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = document.createElement('div');
                              fallback.className = 'w-16 h-16 text-2xl flex items-center justify-center text-blue-600';
                              fallback.innerHTML = '🏢';
                              target.parentNode?.appendChild(fallback);
                            }}
                          />
                        ) : (
                          <div className="w-16 h-16 text-2xl flex items-center justify-center text-blue-600">🏢</div>
                        )}
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-semibold group-hover:text-blue-600 transition-colors">
                            {partner.name}
                          </h3>
                          <p className="text-gray-600 mt-1">{partner.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            {partner.commissionRate}%
                          </div>
                          <div className="text-sm text-gray-500">Commission</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {partner.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Est. {partner.established}
                        </div>
                        <div className="flex items-center gap-1">
                          <BarChart3 className="w-4 h-4" />
                          {partner.projectsCount} projects
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          {partner.successRate}% success
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {partner.specialties.map((specialty) => (
                          <Badge key={specialty} variant="outline" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedPartner(partner)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                                                 <a 
                           href={partner.website} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium inline-flex items-center justify-center transition-colors"
                         >
                           <ExternalLink className="w-4 h-4 mr-2" />
                           Visit Website
                         </a>
                         {partner.contactEmail && (
                           <a 
                             href={`mailto:${partner.contactEmail}`}
                             className="px-4 py-2 rounded-md text-sm font-medium inline-flex items-center justify-center transition-colors hover:bg-gray-100"
                           >
                             <Mail className="w-4 h-4 mr-2" />
                             Contact
                           </a>
                         )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {filteredAndSortedPartners.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No partners found</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Try adjusting your search terms or filters to find the right partner for your needs.
            </p>
          </div>
        )}
      </div>

      {/* Partner Detail Modal */}
      {selectedPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                    {typeof selectedPartner.logo === 'string' && (selectedPartner.logo.startsWith('partners-logos/') || selectedPartner.logo.startsWith('http')) ? (
                      <img 
                        src={selectedPartner.logo.startsWith('http') ? selectedPartner.logo : `https://wkxbhvckmgrmdkdkhnqo.supabase.co/storage/v1/object/public/${selectedPartner.logo}`}
                        alt={`${selectedPartner.name} logo`}
                        className="w-16 h-16 object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = document.createElement('div');
                          fallback.className = 'w-16 h-16 text-2xl flex items-center justify-center text-blue-600';
                          fallback.innerHTML = '🏢';
                          target.parentNode?.appendChild(fallback);
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 text-2xl flex items-center justify-center text-blue-600">🏢</div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedPartner.name}</h2>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        {selectedPartner.commissionRate}% Commission
                      </Badge>
                      <Badge variant="outline">{selectedPartner.successRate}% Success Rate</Badge>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPartner(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </Button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">About</h3>
                  <p className="text-gray-600 leading-relaxed">{selectedPartner.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Established</div>
                    <div className="font-semibold">{selectedPartner.established}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Projects</div>
                    <div className="font-semibold">{selectedPartner.projectsCount?.toLocaleString()}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Location</div>
                    <div className="font-semibold">{selectedPartner.location}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Success Rate</div>
                    <div className="font-semibold text-green-600">{selectedPartner.successRate}%</div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Specialties</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedPartner.specialties.map((specialty) => (
                      <Badge key={specialty} variant="outline" className="px-3 py-1">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
                  <div className="space-y-3">
                    {selectedPartner.contactEmail && (
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <a href={`mailto:${selectedPartner.contactEmail}`} className="text-blue-600 hover:underline">
                          {selectedPartner.contactEmail}
                        </a>
                      </div>
                    )}
                    {selectedPartner.contactPhone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <a href={`tel:${selectedPartner.contactPhone}`} className="text-blue-600 hover:underline">
                          {selectedPartner.contactPhone}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <GlobeIcon className="w-5 h-5 text-gray-400" />
                      <a href={selectedPartner.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {selectedPartner.website}
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                                     <a 
                     href={selectedPartner.website} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium inline-flex items-center justify-center transition-colors"
                   >
                     <ExternalLink className="w-4 h-4 mr-2" />
                     Visit Website
                   </a>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setSelectedPartner(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Section */}
      <div className="px-6 py-16 mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Partner With Us?</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join a network of successful real estate professionals and unlock new opportunities
          </p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-3">
          <div className="text-center group">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Higher Commissions</h3>
            <p className="text-gray-600 leading-relaxed">
              Earn up to 5% commission on premium projects with our exclusive partner network
            </p>
          </div>
          
          <div className="text-center group">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Target className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Premium Projects</h3>
            <p className="text-gray-600 leading-relaxed">
              Access to exclusive, high-value real estate projects across Egypt's top locations
            </p>
          </div>
          
          <div className="text-center group">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Award className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Recognition</h3>
            <p className="text-gray-600 leading-relaxed">
              Build your reputation with top-tier partners and gain industry recognition
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
