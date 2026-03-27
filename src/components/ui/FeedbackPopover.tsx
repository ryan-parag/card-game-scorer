import { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { Button } from './button';
import { AnimatePresence, motion } from 'motion/react';

const FeedbackPopover = ({ back }: { back: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, sending, success, error

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');

    try {
      const response = await fetch('/api/slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `New Feedback from ${email.length > 0 ? email : 'Unknown'}: ${feedback}` }),
      });

      if (response.ok) {
        setStatus('success');
        setFeedback('');
        setEmail('');
        setTimeout(() => setIsOpen(false), 500);
      } else {
        throw new Error('Failed to send');
      }
    } catch (error) {
      setStatus('error');
    }
  };

  return (
    <div className="inline-flex relative">
      <AnimatePresence>
        <div
          data-expanded={isOpen}
          className={`transition transform bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-white shadow-lg overflow-hidden rounded-full data-[expanded=true]:rounded-lg ${isOpen ? `absolute ${back ? '-top-6' : 'top-0'} left-1 z-30` : 'relative'}`}
        >
          {
            isOpen ? (
              <motion.div
                className="relative left-0 top-0 p-3 flex flex-col w-0 h-0 data-[expanded=true]:w-80 data-[expanded=true]:h-auto"
                data-expanded={isOpen}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.24, delay: 0 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={16} />
                    <h3 className="text-sm font-medium">Feedback</h3>
                  </div>
                  <Button variant="outline" size="icon" className="w-8 h-8 rounded-full border-transparent" onClick={() => setIsOpen(false)}>
                    <X size={20} />
                  </Button>
                </div>
                <form onSubmit={handleSubmit}>
                  <textarea
                    className="w-full border border-stone-200 dark:border-stone-600 p-2 text-sm rounded-md bg-transparent focus:outline-none focus:ring-0 dark:focus:border-stone-200 focus:border-stone-500 h-32 placeholder:text-stone-400 dark:placeholder:text-stone-500"
                    placeholder="Ideas, suggestions, or issues"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    required
                  />
                  <hr/>
                  <input
                    type="email"
                    placeholder="Your email (optional)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-stone-200 dark:border-stone-600 p-2 text-sm rounded-md bg-transparent focus:outline-none focus:ring-0 dark:focus:border-stone-200 focus:border-stone-500 placeholder:text-stone-400 dark:placeholder:text-stone-500"
                  />
                  <Button
                    type="submit"
                    disabled={status === 'sending' || feedback.length < 8}
                    className="w-full mt-2 disabled:opacity-30 disabled:cursor-not-allowed">
                      {status === 'sending' ? 'Sending...' : 'Send Feedback'}
                  </Button>
                  {status === 'success' && <p className="text-green-700 dark:text-green-300 text-xs mt-1">Sent!</p>}
                  {status === 'error' && <p className="text-red-700 dark:text-red-300 text-xs mt-1">Something went wrong!</p>}
                </form>
              </motion.div>
            )
            :
            (
              <button onClick={() => setIsOpen(!isOpen)} className={`p-3 transition transform text-sm font-medium hover:bg-stone-100 dark:hover:bg-stone-700 active:scale-[97%] active:shadow-inner`}>
                <MessageSquare size={20} />
              </button>
            )
          }
        </div>
      </AnimatePresence>
    </div>
  );
};

export default FeedbackPopover;