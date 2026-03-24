'use client'

import { useState, useEffect } from 'react'
import { Quote, Star, ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { trackTestimonialEngagement, ConversionEvents } from '@/lib/analytics'

interface Testimonial {
  id: string
  name: string
  role: string
  company: string
  content: string
  avatar: string
  rating: number
  videoUrl?: string
  highlight: string
}

interface TestimonialCarouselProps {
  testimonials: Testimonial[]
  className?: string
}

export function TestimonialCarousel({ testimonials, className = '' }: TestimonialCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [isVideoOpen, setIsVideoOpen] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<string>('')

  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, 6000)

    return () => clearInterval(interval)
  }, [isAutoPlaying, testimonials.length])

  const goToPrevious = () => {
    setCurrentIndex((prev) => {
      const newIndex = (prev - 1 + testimonials.length) % testimonials.length
      trackTestimonialEngagement(testimonials[newIndex].id, 'testimonial_navigation')
      return newIndex
    })
    setIsAutoPlaying(false)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => {
      const newIndex = (prev + 1) % testimonials.length
      trackTestimonialEngagement(testimonials[newIndex].id, 'testimonial_navigation')
      return newIndex
    })
    setIsAutoPlaying(false)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
    setIsAutoPlaying(false)
  }

  const openVideo = (videoUrl: string) => {
    setSelectedVideo(videoUrl)
    setIsVideoOpen(true)
    setIsAutoPlaying(false)
  }

  const closeVideo = () => {
    setIsVideoOpen(false)
    setSelectedVideo('')
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
        }`}
      />
    ))
  }

  const currentTestimonial = testimonials[currentIndex]

  return (
    <div className={`relative ${className}`}>
      {/* Main testimonial card */}
      <div className="relative bg-card rounded-2xl border border-border p-8 md:p-12 card-hover-modern">
        {/* Quote icon */}
        <div className="absolute top-6 right-6 text-primary/10">
          <Quote className="w-16 h-16" />
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 items-center">
            {/* Left side - Text content */}
            <div className="md:col-span-2 space-y-6">
              {/* Rating */}
              <div className="flex items-center gap-1">
                {renderStars(currentTestimonial.rating)}
              </div>

              {/* Highlight */}
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-important/10 text-important text-sm font-medium">
                {currentTestimonial.highlight}
              </div>

              {/* Quote */}
              <blockquote className="text-xl md:text-2xl font-medium text-foreground leading-relaxed">
                "{currentTestimonial.content}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-white font-bold">
                  {currentTestimonial.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-foreground">{currentTestimonial.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {currentTestimonial.role} at {currentTestimonial.company}
                  </div>
                </div>
              </div>

              {/* Video button if available */}
              {currentTestimonial.videoUrl && (
                <Button
                  variant="outline"
                  onClick={() => openVideo(currentTestimonial.videoUrl!)}
                  className="w-fit group"
                >
                  <Play className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  Watch Video Story
                </Button>
              )}
            </div>

            {/* Right side - Visual element */}
            <div className="hidden md:block">
              <div className="relative">
                <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto">
                      <span className="text-2xl font-bold">
                        {currentTestimonial.name.charAt(0)}
                      </span>
                    </div>
                    <div className="text-4xl font-bold gradient-text">
                      {currentTestimonial.rating}.0
                    </div>
                    <div className="text-sm text-muted-foreground">User Rating</div>
                  </div>
                </div>
                
                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 w-8 h-8 rounded-full bg-important/20 animate-float" />
                <div className="absolute -bottom-4 -left-4 w-6 h-6 rounded-full bg-accent-amber/20 animate-float-delayed" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        {/* Previous/Next buttons */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrevious}
            className="rounded-full"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNext}
            className="rounded-full"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Dots indicator */}
        <div className="flex items-center gap-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'w-8 bg-primary'
                  : 'bg-muted hover:bg-muted-foreground/50'
              }`}
            />
          ))}
        </div>

        {/* Auto-play toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          className="text-muted-foreground"
        >
          {isAutoPlaying ? 'Pause' : 'Play'} Auto-play
        </Button>
      </div>

      {/* Video modal */}
      {isVideoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-4xl">
            <Button
              variant="ghost"
              size="icon"
              onClick={closeVideo}
              className="absolute -top-12 right-0 text-white hover:bg-white/20"
            >
              ×
            </Button>
            <div className="rounded-2xl overflow-hidden bg-black">
              <video
                src={selectedVideo}
                controls
                autoPlay
                className="w-full aspect-video"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Enhanced testimonials with realistic data
export const enhancedTestimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    role: 'Product Manager',
    company: 'TechCorp',
    content: 'MailOS transformed how I handle my inbox. I went from spending 2 hours daily to just 15 minutes scanning the digest. The AI classification is incredibly accurate - it knows what\'s important before I do.',
    avatar: '/avatars/sarah-chen.jpg',
    rating: 5,
    highlight: 'Time Saver',
    videoUrl: '/videos/sarah-testimonial.mp4'
  },
  {
    id: '2',
    name: 'Michael Rodriguez',
    role: 'Sales Director',
    company: 'StartupXYZ',
    content: 'Never miss an important client email again. The follow-up tracking feature alone is worth the subscription. My response time improved by 60% and I closed 3 more deals this quarter.',
    avatar: '/avatars/michael-rodriguez.jpg',
    rating: 5,
    highlight: 'Revenue Booster'
  },
  {
    id: '3',
    name: 'Emily Watson',
    role: 'Freelance Designer',
    company: 'Self-Employed',
    content: 'As a freelancer, every minute counts. MailOS helps me focus on design work instead of email management. The ROI is incredible - I save about 10 hours per week.',
    avatar: '/avatars/emily-watson.jpg',
    rating: 5,
    highlight: 'Productivity Boost'
  },
  {
    id: '4',
    name: 'David Kim',
    role: 'Engineering Manager',
    company: 'InnovationLab',
    content: 'The AI grouping is magical. All the GitHub notifications, Jira updates, and team threads are automatically organized. I can finally focus on code instead of email triage.',
    avatar: '/avatars/david-kim.jpg',
    rating: 5,
    highlight: 'Developer Favorite'
  },
  {
    id: '5',
    name: 'Lisa Thompson',
    role: 'HR Director',
    company: 'GlobalInc',
    content: 'Managing recruitment emails was overwhelming. MailOS surfaces candidate responses and filters out spam automatically. It\'s like having an executive assistant for my inbox.',
    avatar: '/avatars/lisa-thompson.jpg',
    rating: 5,
    highlight: 'HR Essential'
  }
]
