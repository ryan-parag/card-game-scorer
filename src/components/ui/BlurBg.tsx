import { motion } from "framer-motion";

const BlurBg = () => {
  return (
    <>
      <motion.div
        className="h-72 w-72 rounded-full absolute left-1/2 -translate-x-1/2 z-0 blur-3xl bg-gradient-to-tr from-red-500 via-orange-500 to-yellow-500"
        initial={{ opacity: 0, bottom: '-300px' }}
        animate={{ opacity: .2, bottom: '-200px'  }}
        exit={{ opacity: 0, bottom: '-300px' }}
        transition={{ duration: 0.36, delay: .1, type: "spring", stiffness: 140 }}
      />
      <motion.div
        className="h-48 w-48 rounded-full absolute right-12 z-0 blur-2xl bg-gradient-to-tr from-blue-500 via-teal-500 to-green-500"
        initial={{ opacity: 0, bottom: '-300px' }}
        animate={{ opacity: .12, bottom: '-100px'  }}
        exit={{ opacity: 0, bottom: '-300px' }}
        transition={{ duration: 0.36, delay: .2, type: "spring", stiffness: 140 }}
      />
      <motion.div
        className="h-24 w-24 rounded-full absolute left-0 z-0 blur-xl bg-gradient-to-tr from-purple-500 via-indigo-500 to-blue-500"
        initial={{ opacity: 0, bottom: '-300px' }}
        animate={{ opacity: .1, bottom: '-48px'  }}
        exit={{ opacity: 0, bottom: '-300px' }}
        transition={{ duration: 0.36, delay: .5, type: "spring", stiffness: 140 }}
      />
    </>
  )
}

export default BlurBg;