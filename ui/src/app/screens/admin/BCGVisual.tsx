import { useState } from "react";
import { ZaikaCard } from "../../components/zaika/ZaikaCard";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ZAxis,
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

const bubbleData = [
  {
    name: "Butter Chicken",
    popularity: 92,
    margin: 68,
    revenue: 41400,
    bcg: "star",
    color: "var(--bcg-star)",
  },
  {
    name: "Gulab Jamun",
    popularity: 82,
    margin: 68,
    revenue: 11480,
    bcg: "star",
    color: "var(--bcg-star)",
  },
  {
    name: "Tandoori Chicken",
    popularity: 85,
    margin: 52,
    revenue: 32300,
    bcg: "workhorse",
    color: "var(--bcg-workhorse)",
  },
  {
    name: "Paneer Tikka",
    popularity: 78,
    margin: 52,
    revenue: 24960,
    bcg: "workhorse",
    color: "var(--bcg-workhorse)",
  },
  {
    name: "Samosa",
    popularity: 88,
    margin: 52,
    revenue: 10560,
    bcg: "workhorse",
    color: "var(--bcg-workhorse)",
  },
  {
    name: "Chicken Biryani",
    popularity: 45,
    margin: 72,
    revenue: 18900,
    bcg: "hidden-star",
    color: "var(--bcg-hidden-star)",
  },
  {
    name: "Rogan Josh",
    popularity: 38,
    margin: 72,
    revenue: 18240,
    bcg: "hidden-star",
    color: "var(--bcg-hidden-star)",
  },
  {
    name: "Garlic Naan",
    popularity: 68,
    margin: 35,
    revenue: 5440,
    bcg: "dog",
    color: "var(--bcg-dog)",
  },
];

export default function BCGVisual() {
  const [selectedItem, setSelectedItem] = useState<typeof bubbleData[0] | null>(
    null
  );

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border-2 border-cream-dark rounded-lg p-4 [box-shadow:var(--shadow-card)]">
          <p className="font-medium mb-2">{data.name}</p>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Popularity:</span>{" "}
              <span className="font-mono">{data.popularity}%</span>
            </p>
            <p>
              <span className="text-muted-foreground">Margin:</span>{" "}
              <span className="font-mono">{data.margin}%</span>
            </p>
            <p>
              <span className="text-muted-foreground">Revenue:</span>{" "}
              <span className="font-mono">₹{data.revenue.toLocaleString()}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="mb-2">BCG Matrix Visualization</h2>
        <p className="text-muted-foreground">
          Interactive bubble chart showing menu item performance
        </p>
      </div>

      <ZaikaCard className="mb-6">
        <div className="h-[600px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F5E6D3" />
              <XAxis
                type="number"
                dataKey="popularity"
                name="Popularity"
                unit="%"
                domain={[0, 100]}
                label={{
                  value: "Popularity Score →",
                  position: "bottom",
                  offset: 0,
                }}
              />
              <YAxis
                type="number"
                dataKey="margin"
                name="Margin"
                unit="%"
                domain={[0, 100]}
                label={{
                  value: "← Profit Margin",
                  angle: -90,
                  position: "left",
                  offset: 0,
                }}
              />
              <ZAxis
                type="number"
                dataKey="revenue"
                range={[400, 4000]}
                name="Revenue"
              />
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3" }} />
              <Scatter
                data={bubbleData}
                onClick={(data) => setSelectedItem(data)}
                style={{ cursor: "pointer" }}
              >
                {bubbleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Scatter>

              {/* Quadrant Lines */}
              <line
                x1="50%"
                y1="0"
                x2="50%"
                y2="100%"
                stroke="#E85D04"
                strokeWidth={2}
                strokeDasharray="5 5"
                opacity={0.3}
              />
              <line
                x1="0"
                y1="50%"
                x2="100%"
                y2="50%"
                stroke="#E85D04"
                strokeWidth={2}
                strokeDasharray="5 5"
                opacity={0.3}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Quadrant Labels */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="text-center p-4 bg-bcg-hidden-star/10 rounded-lg">
            <p className="font-medium text-bcg-hidden-star">Hidden Stars</p>
            <p className="text-xs text-muted-foreground mt-1">
              Low Popularity, High Margin
            </p>
          </div>
          <div className="text-center p-4 bg-bcg-star/10 rounded-lg">
            <p className="font-medium text-bcg-star">Stars</p>
            <p className="text-xs text-muted-foreground mt-1">
              High Popularity, High Margin
            </p>
          </div>
          <div className="text-center p-4 bg-bcg-dog/10 rounded-lg">
            <p className="font-medium text-bcg-dog">Dogs</p>
            <p className="text-xs text-muted-foreground mt-1">
              Low Popularity, Low Margin
            </p>
          </div>
          <div className="text-center p-4 bg-bcg-workhorse/10 rounded-lg">
            <p className="font-medium text-bcg-workhorse">Workhorses</p>
            <p className="text-xs text-muted-foreground mt-1">
              High Popularity, Low Margin
            </p>
          </div>
        </div>
      </ZaikaCard>

      {/* Item Drawer */}
      <AnimatePresence>
        {selectedItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setSelectedItem(null)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 p-8 overflow-y-auto [box-shadow:var(--shadow-warm)]"
            >
              <div className="flex items-start justify-between mb-6">
                <h3>{selectedItem.name}</h3>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-2 hover:bg-cream rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Classification
                  </p>
                  <div className="inline-block px-4 py-2 rounded-full text-white font-medium capitalize"
                    style={{ backgroundColor: selectedItem.color }}>
                    {selectedItem.bcg === "hidden-star"
                      ? "Hidden Star"
                      : selectedItem.bcg}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <ZaikaCard className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">
                      Popularity
                    </p>
                    <p className="text-2xl font-mono font-semibold">
                      {selectedItem.popularity}%
                    </p>
                  </ZaikaCard>
                  <ZaikaCard className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">Margin</p>
                    <p className="text-2xl font-mono font-semibold text-success">
                      {selectedItem.margin}%
                    </p>
                  </ZaikaCard>
                </div>

                <ZaikaCard className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">
                    Monthly Revenue
                  </p>
                  <p className="text-2xl font-mono font-semibold text-saffron">
                    ₹{selectedItem.revenue.toLocaleString()}
                  </p>
                </ZaikaCard>

                <div>
                  <p className="text-sm font-medium mb-3">Recommendations</p>
                  <div className="space-y-3">
                    {selectedItem.bcg === "star" && (
                      <>
                        <div className="p-3 bg-success/10 rounded-lg">
                          <p className="text-sm">
                            ✓ Maintain current pricing and quality
                          </p>
                        </div>
                        <div className="p-3 bg-success/10 rounded-lg">
                          <p className="text-sm">
                            ✓ Feature prominently in marketing
                          </p>
                        </div>
                      </>
                    )}
                    {selectedItem.bcg === "hidden-star" && (
                      <>
                        <div className="p-3 bg-warning/10 rounded-lg">
                          <p className="text-sm">
                            → Increase visibility in voice prompts
                          </p>
                        </div>
                        <div className="p-3 bg-warning/10 rounded-lg">
                          <p className="text-sm">
                            → Add to combo meal suggestions
                          </p>
                        </div>
                      </>
                    )}
                    {selectedItem.bcg === "workhorse" && (
                      <>
                        <div className="p-3 bg-bcg-workhorse/10 rounded-lg">
                          <p className="text-sm">
                            → Consider 3-5% price increase
                          </p>
                        </div>
                        <div className="p-3 bg-bcg-workhorse/10 rounded-lg">
                          <p className="text-sm">→ Optimize ingredient costs</p>
                        </div>
                      </>
                    )}
                    {selectedItem.bcg === "dog" && (
                      <>
                        <div className="p-3 bg-error/10 rounded-lg">
                          <p className="text-sm">! Review pricing strategy</p>
                        </div>
                        <div className="p-3 bg-error/10 rounded-lg">
                          <p className="text-sm">! Bundle with high-margin items</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ZaikaCard className="bg-turmeric/10">
        <p className="text-sm">
          <strong>Tip:</strong> Bubble size represents revenue. Click on any
          bubble to see detailed recommendations for that item.
        </p>
      </ZaikaCard>
    </div>
  );
}
