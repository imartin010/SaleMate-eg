import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Phone, 
  MessageCircle, 
  MapPin,
  ArrowRight,
  FileText
} from 'lucide-react';

const CRMPreview = () => {
  // Mock lead data for demonstration - matching the realistic design
  const mockLeads = [
    {
      id: 1,
      name: 'Ahmed Hassan',
      project: 'New Cairo',
      status: 'Potential',
      phone: '+201234567890',
      avatar: 'AH'
    },
    {
      id: 2,
      name: 'Fatima Al-Rashid', 
      project: 'Sidi Abdelrahman',
      status: 'Hot Case',
      phone: '+201987654321',
      avatar: 'FA'
    },
    {
      id: 3,
      name: 'Omar Mahmoud',
      project: 'Mostakbal City', 
      status: 'Meeting Done',
      phone: '+201555123456',
      avatar: 'OM'
    }
  ];

  // Metrics data
  const metrics = {
    costPerLead: 125,
    leadsDelivered: 2340,
    period: 'This month'
  };

  // Get badge color based on status
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Potential':
        return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'Hot Case':
        return 'bg-red-100 text-red-700 border border-red-200';
      case 'Meeting Done':
        return 'bg-green-100 text-green-700 border border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };


  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            Integrated{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CRM Platform
            </span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-6">
            Manage your leads, track progress, and close more deals through our next-generation CRM platform with data-driven insights
          </p>
          
          <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Lead marketplace</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>Data-driven insights</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span>Trusted partnerships</span>
            </div>
          </div>
        </motion.div>

        <div className="max-w-6xl mx-auto">
          {/* Main CRM Interface */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-3xl p-8 shadow-2xl border border-slate-200/50">
            <div className="grid lg:grid-cols-4 gap-6">
              
              {/* Metrics Card */}
              <motion.div
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="lg:col-span-1"
              >
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
                  <div className="text-center">
                    <div className="text-sm text-slate-500 mb-2">{metrics.period}</div>
                    <div className="text-3xl font-bold text-green-600 mb-1">+{metrics.leadsDelivered.toLocaleString()}</div>
                    <div className="text-sm text-slate-600 mb-6">leads delivered</div>
                    
                    <div className="border-t border-slate-100 pt-4">
                      <div className="text-sm text-slate-500 mb-1">Avg. CPL</div>
                      <div className="text-2xl font-bold text-slate-800">EGP {metrics.costPerLead}</div>
                      <div className="text-sm text-slate-500">per lead</div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Lead Cards */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="lg:col-span-3"
              >
                <div className="space-y-4">
                  {mockLeads.map((lead) => (
                    <motion.div
                      key={lead.id}
                      variants={cardVariants}
                      whileHover={{ y: -2, scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            {/* Avatar */}
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                              {lead.avatar}
                            </div>
                            
                            {/* Lead Info */}
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold text-slate-800 text-lg">{lead.name}</h4>
                              </div>
                              
                              <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                                <MapPin className="w-4 h-4" />
                                <span>{lead.project}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <Button 
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition-all text-xs"
                                >
                                  <Phone className="w-3 h-3 mr-1" />
                                  Call
                                </Button>
                                <Button 
                                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition-all text-xs"
                                >
                                  <MessageCircle className="w-3 h-3 mr-1" />
                                  WhatsApp
                                </Button>
                                <Button 
                                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition-all text-xs"
                                >
                                  <FileText className="w-3 h-3 mr-1" />
                                  Send Offer
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <Badge className={`${getStatusBadgeColor(lead.status)} px-3 py-1 rounded-lg font-medium`}>
                            {lead.status}
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          {/* CTA Section */}
          <motion.div 
            className="text-center mt-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
              <h3 className="text-2xl font-bold text-slate-800 mb-4">
                Ready to transform your real estate business?
              </h3>
              <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
                Join our next-generation platform and connect with daily fresh leads through trusted, data-driven partnerships. 
                No credit card required, no setup fees.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/app/crm">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white group">
                    <Users className="w-5 h-5 mr-2" />
                    Explore Platform
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/auth/signup">
                  <Button variant="outline" size="lg">
                    Join Partnership
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CRMPreview;
