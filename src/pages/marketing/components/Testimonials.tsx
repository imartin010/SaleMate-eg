import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Star, Quote } from 'lucide-react';

const Testimonials = () => {
  const testimonials = [
    {
      id: 1,
      name: 'Sarah Ahmed',
      role: 'Senior Real Estate Agent',
      company: 'Elite Properties',
      content: 'SaleMate transformed our lead management. The quality of leads is exceptional, and the CRM makes follow-ups seamless. Our conversion rate increased by 40% in just 3 months.',
      rating: 5,
      image: '/testimonials/sarah-ahmed.jpg',
      stats: '+40% conversion rate'
    },
    {
      id: 2,
      name: 'Mohamed Hassan',
      role: 'Team Manager',
      company: 'Cairo Real Estate',
      content: 'The partner program is a game-changer. Closing under established brands like Nawy and The Address gives us instant credibility and higher commissions. Highly recommended.',
      rating: 5,
      image: '/testimonials/mohamed-hassan.jpg',
      stats: '+25% commission boost'
    },
    {
      id: 3,
      name: 'Layla Mahmoud',
      role: 'Independent Agent',
      company: 'Freelance',
      content: 'As a solo agent, I needed quality leads without breaking the bank. SaleMate delivers exactly that. The leads are pre-qualified and the CRM is intuitive. Perfect solution.',
      rating: 5,
      image: '/testimonials/layla-mahmoud.jpg',
      stats: '60+ deals closed'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 30,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
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
            What Our{' '}
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Agents Say
            </span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Join thousands of successful real estate agents who trust SaleMate for their lead generation
          </p>
        </motion.div>

        {/* Testimonials grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              variants={cardVariants}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <Card className="p-6 h-full bg-white hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
                {/* Quote icon */}
                <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Quote className="w-12 h-12 text-blue-500" />
                </div>

                {/* Rating */}
                <div className="flex items-center justify-between mb-4">
                  <StarRating rating={testimonial.rating} />
                  <div className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    {testimonial.stats}
                  </div>
                </div>

                {/* Content */}
                <blockquote className="text-slate-600 leading-relaxed mb-6 relative z-10">
                  "{testimonial.content}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-4 relative z-10">
                  {/* Avatar placeholder */}
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  
                  <div>
                    <div className="font-semibold text-slate-800">{testimonial.name}</div>
                    <div className="text-sm text-slate-500">{testimonial.role}</div>
                    <div className="text-xs text-blue-600 font-medium">{testimonial.company}</div>
                  </div>
                </div>

                {/* Hover gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Trust indicators */}
        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">4.8/5</div>
              <div className="flex justify-center mb-1">
                <StarRating rating={5} />
              </div>
              <div className="text-sm text-slate-600">Average rating</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">2,500+</div>
              <div className="text-sm text-slate-600">Active agents</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">127</div>
              <div className="text-sm text-slate-600">Reviews</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">98%</div>
              <div className="text-sm text-slate-600">Would recommend</div>
            </div>
          </div>

          {/* Call to action */}
          <motion.div 
            className="mt-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <p className="text-slate-600 mb-4">
              Ready to join our community of successful agents?
            </p>
            <motion.button
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
              whileHover={{ x: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              Read more success stories
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
