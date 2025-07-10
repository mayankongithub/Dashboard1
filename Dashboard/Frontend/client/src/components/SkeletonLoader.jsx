import React from 'react';

const SkeletonLoader = ({ type = 'default', className = '' }) => {
  // Improved pulse animation with smoother timing
  const baseClasses = 'bg-gray-200 rounded relative overflow-hidden';
  const pulseClasses = 'animate-pulse';

  // Add shimmer effect for smoother animation
  const shimmerClasses = 'before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent';

  const skeletonTypes = {
    // Default rectangular skeleton
    default: (
      <div className={`${baseClasses} ${pulseClasses} ${shimmerClasses} h-4 w-full ${className}`}></div>
    ),

    // Chart skeleton
    chart: (
      <div className={`bg-white p-6 rounded-lg shadow-md ${className}`}>
        <div className={`${baseClasses} ${pulseClasses} ${shimmerClasses} h-6 w-48 mx-auto mb-4`}></div>
        <div className={`${baseClasses} ${pulseClasses} ${shimmerClasses} h-64 w-full`}></div>
      </div>
    ),

    // Pie chart skeleton
    pieChart: (
      <div className={`bg-white p-6 rounded-lg shadow-md ${className}`}>
        <div className={`${baseClasses} ${pulseClasses} ${shimmerClasses} h-6 w-48 mx-auto mb-4`}></div>
        <div className="flex justify-center items-center h-[400px]">
          <div className={`${baseClasses} ${pulseClasses} ${shimmerClasses} rounded-full h-64 w-64`}></div>
        </div>
      </div>
    ),

    // Bar chart skeleton
    barChart: (
      <div className={`bg-white p-4 rounded-lg shadow-md ${className}`}>
        <div className={`${baseClasses} ${pulseClasses} ${shimmerClasses} h-6 w-64 mx-auto mb-4`}></div>
        <div className="flex items-end justify-center space-x-2 h-[400px] p-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="flex flex-col items-center space-y-1">
              <div className={`${baseClasses} ${pulseClasses} ${shimmerClasses} w-8`} style={{ height: `${Math.random() * 200 + 50}px` }}></div>
              <div className={`${baseClasses} ${pulseClasses} ${shimmerClasses} w-8`} style={{ height: `${Math.random() * 200 + 50}px` }}></div>
              <div className={`${baseClasses} ${pulseClasses} ${shimmerClasses} h-3 w-8`}></div>
            </div>
          ))}
        </div>
      </div>
    ),

    // Table skeleton
    table: (
      <div className={`w-full ${className}`}>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="bg-gray-300 py-2 px-4">
                <div className={`${baseClasses} h-4 w-full`}></div>
              </th>
              <th className="bg-gray-300 py-2 px-4">
                <div className={`${baseClasses} h-4 w-full`}></div>
              </th>
            </tr>
          </thead>
          <tbody>
            {[...Array(3)].map((_, i) => (
              <tr key={i} className="bg-gray-100">
                <td className="py-2 px-4 border border-gray-300">
                  <div className={`${baseClasses} h-4 w-full`}></div>
                </td>
                <td className="py-2 px-4 border border-gray-300">
                  <div className={`${baseClasses} h-4 w-full`}></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),

    // Text skeleton
    text: (
      <div className={`space-y-2 ${className}`}>
        <div className={`${baseClasses} h-4 w-full`}></div>
        <div className={`${baseClasses} h-4 w-5/6`}></div>
        <div className={`${baseClasses} h-4 w-4/6`}></div>
      </div>
    ),

    // Title skeleton
    title: (
      <div className={`${baseClasses} h-8 w-64 mx-auto ${className}`}></div>
    ),

    // Button skeleton
    button: (
      <div className={`${baseClasses} h-10 w-32 ${className}`}></div>
    ),

    // Card skeleton
    card: (
      <div className={`bg-white p-6 rounded-lg shadow-md ${className}`}>
        <div className={`${baseClasses} h-6 w-3/4 mb-4`}></div>
        <div className="space-y-2">
          <div className={`${baseClasses} h-4 w-full`}></div>
          <div className={`${baseClasses} h-4 w-5/6`}></div>
          <div className={`${baseClasses} h-4 w-4/6`}></div>
        </div>
      </div>
    ),

    // Dashboard skeleton - combines multiple elements
    dashboard: (
      <div className="min-h-screen bg-white p-6 pt-4">
        <div className="max-w-7xl mx-auto mb-8">
          {/* Title skeleton */}
          <div className={`${baseClasses} h-8 w-64 mx-auto mb-4`}></div>
          <div className={`${baseClasses} h-4 w-96 mx-auto mb-8`}></div>

          <div className="flex flex-col md:flex-row justify-center gap-8 max-w-6xl mx-auto">
            {/* Table skeleton */}
            <div className="w-full md:w-1/3">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="bg-gray-300 py-2 px-4">
                      <div className={`${baseClasses} h-4 w-full`}></div>
                    </th>
                    <th className="bg-gray-300 py-2 px-4">
                      <div className={`${baseClasses} h-4 w-full`}></div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(3)].map((_, i) => (
                    <tr key={i} className="bg-gray-100">
                      <td className="py-2 px-4 border border-gray-300">
                        <div className={`${baseClasses} h-4 w-full`}></div>
                      </td>
                      <td className="py-2 px-4 border border-gray-300">
                        <div className={`${baseClasses} h-4 w-full`}></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pie chart skeleton */}
            <div className="w-full md:w-2/3 bg-white p-6 rounded-lg shadow-md">
              <div className={`${baseClasses} h-6 w-48 mx-auto mb-4`}></div>
              <div className="flex justify-center items-center h-[400px]">
                <div className={`${baseClasses} rounded-full h-64 w-64`}></div>
              </div>
            </div>
          </div>

          {/* Button skeleton */}
          <div className="mt-6 text-center">
            <div className={`${baseClasses} h-12 w-48 mx-auto`}></div>
          </div>
        </div>

        {/* Divider */}
        <div className="max-w-7xl mx-auto my-8">
          <div className={`${baseClasses} h-px w-full`}></div>
        </div>

        {/* Bar chart section skeleton */}
        <div className="max-w-7xl mx-auto mt-16">
          <div className={`${baseClasses} h-8 w-96 mx-auto mb-4`}></div>
          <div className={`${baseClasses} h-4 w-128 mx-auto mb-8`}></div>

          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex items-end justify-center space-x-2 h-[500px] p-4">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="flex flex-col items-center space-y-1">
                  <div className={`${baseClasses} w-8`} style={{ height: `${Math.random() * 300 + 100}px` }}></div>
                  <div className={`${baseClasses} w-8`} style={{ height: `${Math.random() * 300 + 100}px` }}></div>
                  <div className={`${baseClasses} h-3 w-8`}></div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 text-center">
            <div className={`${baseClasses} h-12 w-48 mx-auto`}></div>
          </div>
        </div>
      </div>
    )
  };

  return skeletonTypes[type] || skeletonTypes.default;
};

export default SkeletonLoader;
