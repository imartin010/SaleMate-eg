import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Phone, 
  MessageCircle, 
  Calendar, 
  TrendingUp,
  MapPin,
  DollarSign,
  Clock,
  ArrowRight,
  Eye
} from 'lucide-react';

const CRMPreview = () => {
  // Mock lead data for demonstration
  const mockLeads = [
    {
      id: 1,
      name: 'Ahmed Hassan',
      project: 'New Capital',
      status: 'hot',
      value: '2.5M',
      lastContact: '2 hours ago',
      stage: 'Viewing Scheduled',
      phone: '+201234567890',
      notes: 'Interested in 2-bedroom apartment'
    },
    {
      id: 2,
      name: 'Fatima Al-Rashid',
      project: 'Maadi Residences',
      status: 'warm',
      value: '1.8M',
      lastContact: '1 day ago',
      stage: 'First Contact',
      phone: '+201987654321',
      notes: 'Looking for family home'
    },
    {
      id: 3,
      name: 'Omar Mahmoud',
      project: 'Sheikh Zayed',
      status: 'cold',
      value: '3.2M',
      lastContact: '3 days ago',
      stage: 'Follow-up',
      phone: '+201555123456',
      notes: 'Budget concerns discussed'
    }
  ];

  const pipelineStages = [
    { name: 'New Leads', count: 24, color: 'bg-blue-500' },
    { name: 'Contacted', count: 18, color: 'bg-yellow-500' },
    { name: 'Qualified', count: 12, color: 'bg-green-500' },
    { name: 'Viewing', count: 8, color: 'bg-purple-500' },
    { name: 'Negotiating', count: 5, color: 'bg-orange-500' },
    { name: 'Closed', count: 3, color: 'bg-emerald-500' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hot': return 'bg-red-100 text-red-700 border-red-200';
      case 'warm': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'cold': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
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
      transition: { duration: 0.6, ease: "easeOut" }
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
            Powerful{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CRM Included
            </span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-6">
            Manage your leads, track progress, and close more deals with our free, built-in CRM system
          </p>
          
          <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Free forever</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>No setup required</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span>Team collaboration</span>
            </div>
          </div>
        </motion.div>

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Pipeline Overview */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="lg:col-span-1"
            >
              <Card className="p-6 h-full hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">Pipeline Overview</h3>
                </div>

                <div className="space-y-4">
                  {pipelineStages.map((stage, index) => (
                    <motion.div
                      key={stage.name}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ x: 5 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 ${stage.color} rounded-full`} />
                        <span className="text-sm font-medium text-slate-700">{stage.name}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {stage.count}
                      </Badge>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Total Active</span>
                    <span className="font-semibold text-slate-800">70 leads</span>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Lead Cards */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="lg:col-span-2"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">Recent Leads</h3>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View All
                  </Button>
                </div>

                {mockLeads.map((lead, index) => (
                  <motion.div
                    key={lead.id}
                    variants={cardVariants}
                    whileHover={{ y: -2, scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Card className="p-4 hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-slate-800">{lead.name}</h4>
                            <Badge className={`text-xs ${getStatusColor(lead.status)}`}>
                              {lead.status.toUpperCase()}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <MapPin className="w-4 h-4" />
                              {lead.project}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <DollarSign className="w-4 h-4" />
                              EGP {lead.value}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Clock className="w-4 h-4" />
                              {lead.lastContact}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <TrendingUp className="w-4 h-4" />
                              {lead.stage}
                            </div>
                          </div>

                          <p className="text-sm text-slate-500 mb-3">{lead.notes}</p>

                          <div className="flex items-center gap-2">
                            <Button size="sm" className="crm-button crm-button-primary">
                              <Phone className="w-4 h-4 mr-1" />
                              Call
                            </Button>
                            <Button size="sm" variant="outline">
                              <MessageCircle className="w-4 h-4 mr-1" />
                              WhatsApp
                            </Button>
                            <Button size="sm" variant="outline">
                              <Calendar className="w-4 h-4 mr-1" />
                              Schedule
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
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
                Ready to see your CRM in action?
              </h3>
              <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
                Sign up for free and get instant access to our complete CRM system. 
                No credit card required, no setup fees.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="crm-button crm-button-primary group">
                  <Link to="/crm">
                    <Users className="w-5 h-5 mr-2" />
                    Explore CRM
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/auth/signup">
                    Start Free Account
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CRMPreview;
