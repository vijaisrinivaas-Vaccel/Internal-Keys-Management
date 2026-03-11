export default function SkeletonPageLoader() {
  return (
    <div className="p-6 space-y-6 animate-pulse">

      {/* Header */}
      <div className="h-8 w-64 bg-gray-200 rounded"></div>

      {/* Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="h-28 bg-gray-200 rounded-lg"></div>
        <div className="h-28 bg-gray-200 rounded-lg"></div>
        <div className="h-28 bg-gray-200 rounded-lg"></div>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-lg p-4 space-y-3">
        <div className="h-6 w-48 bg-gray-200 rounded"></div>

        {[1,2,3,4,5].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="h-6 w-1/4 bg-gray-200 rounded"></div>
            <div className="h-6 w-1/4 bg-gray-200 rounded"></div>
            <div className="h-6 w-1/4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>

    </div>
  );
}