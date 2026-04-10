import { motion } from "framer-motion";
import { Heart, Spade, Club, Diamond } from "lucide-react";

export const ScorekeeperLogo = ({ size = "md" }) => {

  const sizeClasses = {
    sm: "w-12 h-12 rounded-xl rounded-xl",
    md: "w-16 lg:w-24 h-16 lg:h-24 rounded-2xl lg:rounded-3xl",
    lg: "w-24 h-24 rounded-3xl"
  };
  const sizeClass = sizeClasses[size];

  const innerSizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 lg:w-12 h-8 lg:h-12",
    lg: "w-12 h-12"
  };
  const innerSizeClass = innerSizeClasses[size];

  const iconSizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 lg:w-8 h-5 lg:h-8",
    lg: "w-8 h-8"
  };
  const iconSizeClass = iconSizeClasses[size];

  return(
    <motion.div
      initial={{ opacity: 0, y: 32, rotate: 0 }}
      animate={{ opacity: 1, y: 0, rotate: -12 }}
      exit={{ opacity: 0, y: 32, rotate: 0 }}
      transition={{ duration: 0.24, delay: 0.4, type: "spring", stiffness: 150 }}
      className={`mx-auto grid grid-cols-2 gap-0 ${sizeClass} mb-6 shadow-2xl shadow-red-500/30 overflow-hidden border border-stone-500 dark:border-stone-800 transform relative`}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: .5 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, delay: 0.6, type: "spring", stiffness: 145 }}
        className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-b from-transparent to-white"
      />
      <div className={`${innerSizeClass} bg-red-500 flex items-center justify-center`}>
        <Heart className={`text-white ${iconSizeClass}`} />
      </div>
      <div className={`${innerSizeClass} bg-black flex items-center justify-center`}>
        <Spade className={`text-white ${iconSizeClass}`} />
      </div>
      <div className={`${innerSizeClass} bg-black flex items-center justify-center`}>
        <Club className={`text-white ${iconSizeClass}`} />
      </div>
      <div className={`${innerSizeClass} bg-red-500 flex items-center justify-center`}>
        <Diamond className={`text-white ${iconSizeClass}`} />
      </div>
    </motion.div>
  )
}