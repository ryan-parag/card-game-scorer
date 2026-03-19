import { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { Button } from './ui/button';
import { AnimatePresence, motion } from 'motion/react';

const FeedbackPopover = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, sending, success, error

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');

    try {
      // It is highly recommended to call your own backend/API route here
      // instead of Slack's URL directly to hide your Webhook URL.
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
    <div className="fixed bottom-10 right-6 z-50">
      <AnimatePresence>
        <div className={`transition transform bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-white shadow-lg overflow-hidden ${isOpen ? 'rounded-lg' : 'rounded-full'}`}>
          {
            isOpen ? (
              <motion.div
                className="p-3 flex flex-col w-80"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.24, delay: 0 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">Feedback</h3>
                  <Button variant="outline" size="icon" className="w-8 h-8 rounded-full" onClick={() => setIsOpen(false)}>
                    <X size={20} />
                  </Button>
                </div>
                <form onSubmit={handleSubmit}>
                  <textarea
                    className="w-full border border-stone-200 dark:border-stone-600 p-2 text-sm rounded-lg bg-transparent focus:outline-none focus:ring-0 dark:focus:border-stone-200 focus:border-stone-500 h-32"
                    placeholder="What can we improve?"
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
                    className="w-full border border-stone-200 dark:border-stone-600 p-2 text-sm rounded-lg bg-transparent focus:outline-none focus:ring-0 dark:focus:border-stone-200 focus:border-stone-500"
                  />
                  <Button
                    type="submit"
                    disabled={status === 'sending' || feedback.length < 8}
                    className="w-full mt-2 disabled:opacity-50 disabled:cursor-not-allowed">
                      {status === 'sending' ? 'Sending...' : 'Send Feedback'}
                  </Button>
                  {status === 'success' && <p className="text-green-700 dark:text-green-300 text-xs mt-1">Sent!</p>}
                  {status === 'error' && <p className="text-red-700 dark:text-red-300 text-xs mt-1">Something went wrong!</p>}
                </form>
              </motion.div>
            )
            :
            (
              <button onClick={() => setIsOpen(!isOpen)} className={`p-3 transition transform text-sm font-medium hover:bg-stone-100 dark:hover:bg-stone-700 active:scale-95`}>
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