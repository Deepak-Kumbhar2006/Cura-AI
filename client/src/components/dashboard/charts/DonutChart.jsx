import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#3b82f6', '#f472b6', '#eab308', '#34d399', '#a78bfa'];

export default function DonutChart({ data }) {
  return (
    <div className="dashboard-glass rounded-2xl p-4">
      <h3 className="font-semibold dashboard-text mb-3">Disease Distribution</h3>
      <div className="h-64">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={58} outerRadius={92} paddingAngle={3}>
              {data.map((entry, i) => <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <p className="text-center -mt-28 mb-16">
        <span className="text-3xl font-bold dashboard-text">4,46,40,738</span>
      </p>
    </div>
  );
}
