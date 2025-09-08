import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { ChevronDown, HelpCircle } from 'lucide-react';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept multiple payment methods for your convenience: Instapay, Vodafone Cash, and Bank Transfer. After placing your order, simply upload your payment receipt and our admin team will validate it quickly, usually within 2-4 hours during business hours.'
    },
    {
      question: 'What is the minimum order requirement?',
      answer: 'The minimum order is 50 leads per project. This ensures you get a substantial volume to work with while maintaining cost-effectiveness. You can purchase leads from multiple projects in a single order if needed.'
    },
    {
      question: 'How do partner commissions work?',
      answer: 'Partner commission rates are clearly shown for each project in our shop. When you close a deal under a partner brand (The Address Investments, Bold Routes, Nawy, or Coldwell Banker), you qualify for the higher commission rate. Simply indicate the partner when finalizing your sale.'
    },
    {
      question: 'How do you handle duplicate leads?',
      answer: 'We have robust duplicate detection systems in place. Each lead is checked against our database before delivery. If you receive a duplicate lead that you\'ve previously purchased from us, we\'ll provide a replacement lead at no extra cost.'
    },
    {
      question: 'What makes your leads high-quality?',
      answer: 'Our leads are project-tagged, meaning they\'ve expressed specific interest in particular developments. They undergo compliance checks, duplicate removal, and quality verification. We also track lead performance metrics to continuously improve our sourcing.'
    },
    {
      question: 'Is the CRM really free forever?',
      answer: 'Yes, absolutely! Our CRM is completely free with no hidden fees, setup costs, or monthly subscriptions. You get full access to pipeline management, contact tracking, WhatsApp integration, phone actions, notes, and team collaboration features.'
    },
    {
      question: 'How quickly will I receive my leads?',
      answer: 'Once your payment is validated (usually 2-4 hours), leads are automatically imported into your CRM. You can start working them immediately. For urgent orders, contact our support team for expedited processing.'
    },
    {
      question: 'Can I share leads with my team?',
      answer: 'Yes! Our CRM supports team collaboration. You can assign leads to team members, track their progress, add notes, and maintain full visibility over your team\'s activities. Perfect for agencies and team leaders.'
    }
  ];

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
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
          <div className="flex items-center justify-center gap-3 mb-4">
            <HelpCircle className="w-8 h-8 text-blue-600" />
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800">
              Frequently Asked{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Questions
              </span>
            </h2>
          </div>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Everything you need to know about SaleMate leads and CRM
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <div className="max-w-4xl mx-auto">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="mb-4"
            >
              <Card className="overflow-hidden border-2 border-gray-100 hover:border-blue-200 transition-colors duration-300">
                <motion.button
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                  onClick={() => toggleAccordion(index)}
                  whileHover={{ backgroundColor: "rgba(249, 250, 251, 0.8)" }}
                >
                  <h3 className="text-lg font-semibold text-slate-800 pr-4">
                    {faq.question}
                  </h3>
                  <motion.div
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="flex-shrink-0"
                  >
                    <ChevronDown className="w-5 h-5 text-slate-500" />
                  </motion.div>
                </motion.button>

                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 border-t border-gray-100">
                        <motion.p
                          initial={{ y: -10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -10, opacity: 0 }}
                          transition={{ duration: 0.2, delay: 0.1 }}
                          className="text-slate-600 leading-relaxed pt-4"
                        >
                          {faq.answer}
                        </motion.p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div 
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
            <h3 className="text-xl font-bold text-slate-800 mb-3">
              Still have questions?
            </h3>
            <p className="text-slate-600 mb-6">
              Our support team is here to help you get started and succeed with SaleMate
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Contact Support
              </motion.button>
              <motion.button
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-slate-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Schedule Demo Call
              </motion.button>
            </div>

            <div className="flex items-center justify-center gap-6 mt-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>24/7 Support</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span>Free Setup Help</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span>No Commitment</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ;
