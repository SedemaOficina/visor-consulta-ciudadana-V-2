const SkeletonAnalysis = () => (
    <div className="animate-fade-in space-y-4 w-full">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center mb-4">
            <div className="h-6 w-24 skeleton rounded bg-gray-200" />
            <div className="h-4 w-16 skeleton rounded bg-gray-200" />
        </div>

        {/* Banner Skeleton */}
        <div className="h-24 w-full skeleton rounded-xl bg-gray-100 mb-4" />

        {/* Details grid skeleton */}
        <div className="grid grid-cols-2 gap-3">
            <div className="h-12 w-full skeleton rounded bg-gray-100" />
            <div className="h-12 w-full skeleton rounded bg-gray-100" />
        </div>

        {/* Long block skeleton */}
        <div className="h-40 w-full skeleton rounded-xl bg-gray-100 mt-4" />
    </div>
);

window.App.Components.SkeletonAnalysis = SkeletonAnalysis;
