import { motion } from "framer-motion";

interface DailyPoint {
  date: string;
  uniques: number;
  views: number;
}

interface VisitorsChartProps {
  data: DailyPoint[];
}

export function VisitorsChart({ data }: VisitorsChartProps) {
  const max = Math.max(1, ...data.map((d) => d.views));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-flow-900 border border-flow-800/50 rounded-xl p-5"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs uppercase tracking-wide text-flow-500 font-medium">
          Last 30 days
        </h3>
        <div className="flex items-center gap-4 text-[11px] text-flow-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-accent-500" />
            Unique visitors
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-flow-700" />
            Page views
          </span>
        </div>
      </div>

      <div className="flex items-end gap-1 h-44">
        {data.map((point, i) => {
          const viewsHeight = (point.views / max) * 100;
          const uniquesHeight = (point.uniques / max) * 100;
          // Show date label only every ~5 days to avoid crowding.
          const showLabel = i % 5 === 0 || i === data.length - 1;
          const day = point.date.slice(8, 10);
          const month = point.date.slice(5, 7);
          return (
            <div
              key={point.date}
              className="flex-1 flex flex-col items-center gap-1 group relative"
            >
              <div className="w-full h-full flex items-end relative">
                <motion.div
                  className="absolute inset-x-0 bottom-0 bg-flow-700 rounded-t-sm"
                  initial={{ height: 0 }}
                  animate={{ height: `${viewsHeight}%` }}
                  transition={{ duration: 0.4, delay: 0.05 + i * 0.01 }}
                />
                <motion.div
                  className="absolute inset-x-0 bottom-0 bg-accent-500 rounded-t-sm"
                  initial={{ height: 0 }}
                  animate={{ height: `${uniquesHeight}%` }}
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.01 }}
                />
              </div>
              <span
                className={`text-[9px] text-flow-500 ${showLabel ? "" : "opacity-0"}`}
              >
                {day}/{month}
              </span>
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-2 py-1 bg-flow-black border border-flow-700 rounded-md text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                <p className="text-white font-medium">{point.date}</p>
                <p className="text-accent-400">{point.uniques} unique</p>
                <p className="text-flow-400">{point.views} views</p>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
