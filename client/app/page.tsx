'use client'

import React, { useState } from "react"
import { CanvasRevealEffect } from "@/components/ui/canvas-effect"
import { icons } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Send, Loader2 } from "lucide-react"
import ReactMarkdown from 'react-markdown'

export default function Home() {
  const [question, setQuestion] = useState('')
  const [response, setResponse] = useState('')
  const [messages, setMessages] = useState<Array<{type: 'user' | 'assistant', content: string}>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hovered, setHovered] = React.useState(false)

  const handleNewChat = () => {
    setQuestion('')
    setResponse('')
    setMessages([])
    setIsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setResponse('')
    
    // Add user message immediately
    setMessages(prev => [...prev, { type: 'user', content: question }])
    
    try {
      const res = await fetch('/api/langflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: question }),
      })
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json()
      
      if (data.error) {
        console.error('API Error:', data.error, data.details);
        throw new Error(data.error);
      }
      
      const responseText = data.response || 'No response received';
      setResponse(responseText)
      setMessages(prev => [...prev, { type: 'assistant', content: responseText }])
      setQuestion('')
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error occurred while fetching response. Please try again.'
      setResponse(errorMessage)
      setMessages(prev => [...prev, { type: 'assistant', content: errorMessage }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-[#000000] min-h-screen flex items-center justify-center p-4">
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative mx-auto min-w-[400px] w-full max-w-[1000px] items-center justify-center overflow-hidden"
      >
        <div className="relative flex w-full items-center justify-center">
          <AnimatePresence>
            <div className="tracking-tightest flex select-none flex-col py-2 text-center text-3xl font-extrabold leading-none md:flex-col md:text-8xl lg:flex-row"></div>
            {hovered && (
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 1 }}
                className="absolute inset-0 h-full w-full object-cover"
              >
                <CanvasRevealEffect
                  animationSpeed={5}
                  containerClassName="bg-transparent opacity-30 dark:opacity-50"
                  colors={[
                    [255, 255, 255],  // White
                    [255, 255, 0],    // Yellow
                    [255, 165, 0]     // Orange
                  ]}
                  opacities={[0.3, 0.5, 0.7, 0.8, 0.9, 1, 1, 1, 1, 1]}
                  dotSize={2}
                />
              </motion.div>
            )}
          </AnimatePresence>
          <div className="z-20 w-full min-w-[400px] max-w-[1000px] mx-auto">
            <ScrollArea className="h-[800px] min-h-[400px] w-full rounded-md border border-neutral-800 bg-black/40 p-4">
              <div className="px-6">
                <div className="relative flex h-full w-full justify-center text-center">
                  <h1 className="flex select-none py-2 text-center text-2xl font-extrabold leading-none tracking-tight md:text-2xl lg:text-4xl">
                    <span
                      data-content="Customer."
                      className="before:animate-gradient-background-1 relative before:absolute before:bottom-4 before:left-0 before:top-0 before:z-0 before:w-full before:px-2 before:content-[attr(data-content)] sm:before:top-0"
                    >
                      <span className="from-gradient-1-start to-gradient-1-end animate-gradient-foreground-1 bg-gradient-to-r bg-clip-text px-2 text-transparent">
Customer.                      </span>
                    </span>
                    <span
                      data-content="Support."
                      className="before:animate-gradient-background-2 relative before:absolute before:bottom-0 before:left-0 before:top-0 before:z-0 before:w-full before:px-2 before:content-[attr(data-content)] sm:before:top-0"
                    >
                      <span className="from-gradient-2-start to-gradient-2-end animate-gradient-foreground-2 bg-gradient-to-r bg-clip-text px-2 text-transparent">
                        Support.
                      </span>
                    </span>
                    <span
                      data-content="AI Agent."
                      className="before:animate-gradient-background-3 relative before:absolute before:bottom-1 before:left-0 before:top-0 before:z-0 before:w-full before:px-2 before:content-[attr(data-content)] sm:before:top-0"
                    >
                      <span className="from-gradient-3-start to-gradient-3-end animate-gradient-foreground-3 bg-gradient-to-r bg-clip-text px-2 text-transparent">
                        AI Agent.
                      </span>
                    </span>
                  </h1>
                </div>
                <p className="md:text-md lg:text-md mx-auto mt-1 text-center text-xs text-white/60 md:max-w-2xl">
                  How can I help you today?
                </p>
              </div>
              <div id="chat" className="h-full w-full">
                <div className="">
                  <div className={cn("pt-4")}>
                    <div className="space-y-4 overflow-hidden p-2">
                      {messages.map((message, index) => (
                        <div 
                          key={index} 
                          className={cn(
                            "rounded-lg p-4",
                            message.type === 'user' 
                              ? "bg-blue-500/10 border border-blue-500/20" 
                              : "bg-neutral-900/50 border border-neutral-800"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className={cn(
                              "text-xs px-2 py-1 rounded",
                              message.type === 'user' 
                                ? "bg-blue-500/20 text-blue-300"
                                : "bg-neutral-800 text-neutral-300"
                            )}>
                              {message.type === 'user' ? 'User Prompt' : 'AI Response'}
                            </span>
                          </div>
                          <div className={cn(
                            message.type === 'assistant' ? "prose prose-invert max-w-none" : "text-white"
                          )}>
                            {message.type === 'assistant' ? (
                              <ReactMarkdown>
                                {message.content}
                              </ReactMarkdown>
                            ) : (
                              message.content
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {/* Loading Message */}
                      {isLoading && (
                        <div className="rounded-lg p-4 bg-neutral-900/50 border border-neutral-800">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs px-2 py-1 rounded bg-amber-500/20 text-amber-300">
                              Customer Agent
                            </span>
                          </div>
                          <div className="text-white flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Customer Agent is working on response...
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>

            <div className="relative mt-4 w-full min-w-[400px] max-w-[1000px] mx-auto">
              <form onSubmit={handleSubmit}>
                <div className="">
                  <Input
                    className="pl-12 dark-input"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask something with AI"
                  />
                </div>

                <Button
                  type="button"
                  variant="default"
                  size="icon"
                  className="absolute left-1.5 top-1.5 h-7 rounded-sm dark-button"
                  onClick={handleNewChat}
                >
                  <Plus className="h-5 w-5 text-white" />
                  <span className="sr-only">New Chat</span>
                </Button>

                <Button
                  type="submit"
                  variant="default"
                  size="icon"
                  className="absolute right-1.5 top-1.5 h-7 rounded-sm dark-button"
                >
                  <Send className="mx-1 h-4 w-4 text-white" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
