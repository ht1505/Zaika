import { useState } from "react";
import { ZaikaCard } from "../../components/zaika/ZaikaCard";
import { BCGBadge } from "../../components/zaika/BCGBadge";
import { ArrowUpDown, Search } from "lucide-react";

type SortField = "name" | "price" | "margin" | "popularity" | "revenue";
type SortDirection = "asc" | "desc";

const menuData = [
  {
    id: 1,
    name: "Butter Chicken",
    category: "Curries",
    price: 450,
    cost: 145,
    margin: 68,
    popularity: 92,
    revenue: 41400,
    bcg: "star" as const,
  },
  {
    id: 2,
    name: "Tandoori Chicken",
    category: "Tandoori",
    price: 380,
    cost: 182,
    margin: 52,
    popularity: 85,
    revenue: 32300,
    bcg: "workhorse" as const,
  },
  {
    id: 3,
    name: "Chicken Biryani",
    category: "Biryani",
    price: 420,
    cost: 118,
    margin: 72,
    popularity: 45,
    revenue: 18900,
    bcg: "hidden-star" as const,
  },
  {
    id: 4,
    name: "Paneer Tikka",
    category: "Appetizers",
    price: 320,
    cost: 154,
    margin: 52,
    popularity: 78,
    revenue: 24960,
    bcg: "workhorse" as const,
  },
  {
    id: 5,
    name: "Garlic Naan",
    category: "Breads",
    price: 80,
    cost: 52,
    margin: 35,
    popularity: 68,
    revenue: 5440,
    bcg: "dog" as const,
  },
  {
    id: 6,
    name: "Rogan Josh",
    category: "Curries",
    price: 480,
    cost: 134,
    margin: 72,
    popularity: 38,
    revenue: 18240,
    bcg: "hidden-star" as const,
  },
  {
    id: 7,
    name: "Gulab Jamun",
    category: "Desserts",
    price: 140,
    cost: 45,
    margin: 68,
    popularity: 82,
    revenue: 11480,
    bcg: "star" as const,
  },
  {
    id: 8,
    name: "Samosa",
    category: "Appetizers",
    price: 120,
    cost: 58,
    margin: 52,
    popularity: 88,
    revenue: 10560,
    bcg: "workhorse" as const,
  },
];

export default function MenuAnalysis() {
  const [sortField, setSortField] = useState<SortField>("revenue");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getMarginColor = (margin: number) => {
    if (margin >= 60) return "text-success";
    if (margin >= 40) return "text-warning";
    return "text-error";
  };

  const getMarginBgColor = (margin: number) => {
    if (margin >= 60) return "bg-success/10";
    if (margin >= 40) return "bg-warning/10";
    return "bg-error/10";
  };

  const filteredData = menuData
    .filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      const modifier = sortDirection === "asc" ? 1 : -1;
      return aValue > bValue ? modifier : -modifier;
    });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="mb-2">Menu Analysis</h2>
        <p className="text-muted-foreground">
          Complete menu performance with BCG classification
        </p>
      </div>

      {/* Search */}
      <ZaikaCard className="mb-6">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={20}
          />
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-cream border border-cream-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-saffron"
          />
        </div>
      </ZaikaCard>

      {/* Table */}
      <ZaikaCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b-2 border-cream-dark">
              <tr className="text-left">
                <th className="pb-4 pr-4">
                  <button
                    onClick={() => handleSort("name")}
                    className="flex items-center gap-2 hover:text-saffron"
                  >
                    <span className="font-medium text-sm">Item Name</span>
                    <ArrowUpDown size={14} />
                  </button>
                </th>
                <th className="pb-4 pr-4">
                  <span className="font-medium text-sm">Category</span>
                </th>
                <th className="pb-4 pr-4">
                  <button
                    onClick={() => handleSort("price")}
                    className="flex items-center gap-2 hover:text-saffron"
                  >
                    <span className="font-medium text-sm">Price</span>
                    <ArrowUpDown size={14} />
                  </button>
                </th>
                <th className="pb-4 pr-4">
                  <span className="font-medium text-sm">Cost</span>
                </th>
                <th className="pb-4 pr-4">
                  <button
                    onClick={() => handleSort("margin")}
                    className="flex items-center gap-2 hover:text-saffron"
                  >
                    <span className="font-medium text-sm">Margin %</span>
                    <ArrowUpDown size={14} />
                  </button>
                </th>
                <th className="pb-4 pr-4">
                  <button
                    onClick={() => handleSort("popularity")}
                    className="flex items-center gap-2 hover:text-saffron"
                  >
                    <span className="font-medium text-sm">Popularity</span>
                    <ArrowUpDown size={14} />
                  </button>
                </th>
                <th className="pb-4 pr-4">
                  <button
                    onClick={() => handleSort("revenue")}
                    className="flex items-center gap-2 hover:text-saffron"
                  >
                    <span className="font-medium text-sm">Revenue</span>
                    <ArrowUpDown size={14} />
                  </button>
                </th>
                <th className="pb-4">
                  <span className="font-medium text-sm">BCG</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-cream-dark last:border-0 hover:bg-cream/50 transition-colors"
                >
                  <td className="py-4 pr-4">
                    <span className="font-medium">{item.name}</span>
                  </td>
                  <td className="py-4 pr-4">
                    <span className="text-sm text-muted-foreground">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-4 pr-4">
                    <span className="font-mono">₹{item.price}</span>
                  </td>
                  <td className="py-4 pr-4">
                    <span className="font-mono text-sm text-muted-foreground">
                      ₹{item.cost}
                    </span>
                  </td>
                  <td className="py-4 pr-4">
                    <span
                      className={`inline-flex items-center justify-center px-3 py-1 rounded-full font-mono text-sm font-medium ${getMarginBgColor(
                        item.margin
                      )} ${getMarginColor(item.margin)}`}
                    >
                      {item.margin}%
                    </span>
                  </td>
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-cream-dark rounded-full overflow-hidden max-w-[100px]">
                        <div
                          className="h-full bg-saffron"
                          style={{ width: `${item.popularity}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs text-muted-foreground">
                        {item.popularity}%
                      </span>
                    </div>
                  </td>
                  <td className="py-4 pr-4">
                    <span className="font-mono font-medium text-saffron">
                      ₹{item.revenue.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-4">
                    <BCGBadge type={item.bcg} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No items found</p>
          </div>
        )}
      </ZaikaCard>

      {/* Legend */}
      <ZaikaCard className="mt-6 bg-turmeric/10">
        <h4 className="mb-3">Margin Color Code</h4>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span>Green: ≥60% (Excellent)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning" />
            <span>Amber: ≥40% (Good)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-error" />
            <span>Red: &lt;40% (Review)</span>
          </div>
        </div>
      </ZaikaCard>
    </div>
  );
}
