'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import { http } from '@/lib/utils/fetch';

interface Project {
  id: string;
  name: string;
}

interface MetricData {
  metric: string;
  [key: string]: number | string;
}

export function MetricsComparison({ projects, range }: { projects: Project[]; range: string }) {
  const [data, setData] = useState<MetricData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjects, setSelectedProjects] = useState<string[]>(
    projects.slice(0, 3).map((p) => p.id)
  );

  useEffect(() => {
    if (selectedProjects.length === 0) return;

    http.get(`/api/analytics/comparison?range=${range}&projects=${selectedProjects.join(',')}`)
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to fetch comparison data:', error);
        setLoading(false);
      });
  }, [range, selectedProjects]);

  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Comparison</CardTitle>
        <div className="flex gap-2 mt-4 flex-wrap">
          {projects.map((project) => (
            <label key={project.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedProjects.includes(project.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedProjects([...selectedProjects, project.id]);
                  } else {
                    setSelectedProjects(selectedProjects.filter((id) => id !== project.id));
                  }
                }}
                className="rounded"
              />
              <span className="text-sm">{project.name}</span>
            </label>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : data.length === 0 ? (
          <div className="h-80 flex items-center justify-center text-gray-500">
            Select projects to compare
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={data}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis domain={[0, 100]} />
              <Legend />
              {selectedProjects.map((projectId, index) => {
                const project = projects.find((p) => p.id === projectId);
                return (
                  <Radar
                    key={projectId}
                    name={project?.name || projectId}
                    dataKey={projectId}
                    stroke={colors[index % colors.length]}
                    fill={colors[index % colors.length]}
                    fillOpacity={0.3}
                  />
                );
              })}
            </RadarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
