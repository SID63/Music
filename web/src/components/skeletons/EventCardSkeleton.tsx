export default function EventCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
      <div className="p-6 space-y-4">
        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        <div className="flex gap-2">
          <div className="h-5 bg-gray-200 rounded-full w-20"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-100 rounded w-5/6"></div>
          <div className="h-3 bg-gray-100 rounded w-4/6"></div>
        </div>
        <div className="flex justify-between pt-4">
          <div className="h-8 bg-gray-200 rounded-lg w-24"></div>
          <div className="h-8 bg-gray-200 rounded-lg w-32"></div>
        </div>
      </div>
    </div>
  );
}
