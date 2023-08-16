import * as d3 from 'd3';
import {
  doc,
  collection,
  onSnapshot,
  addDoc,
  query,
  orderBy,
  limit,
  deleteDoc
} from 'firebase/firestore';
import db from './firebase';

const addButton = document.getElementById('add');

addButton.onclick = (e) => {
  return addDoc(collection(db, 'weather'), {
    temp: Math.round(Math.random() * 100),
    date: Date.now()
  });
};

const ref = collection(db, 'weather');
const q = query(ref, limit(20), orderBy('date', 'desc'));
let unsubscribe = onSnapshot(q, (docSnap) => {
  const data = docSnap.docs
    .map((doc) => ({ ...doc.data(), id: doc.id }))
    .reverse();
  update(data);
});

const svgWidth = 800;
const svgHeight = 600;

const svg = d3
  .select('.canvas')
  .append('svg')
  .attr('width', svgWidth)
  .attr('height', svgHeight)
  .attr('border', '2px solid gray');

const margin = { top: 20, right: 20, bottom: 100, left: 100 };
const chartWidth = svgWidth - margin.left - margin.right;
const chartHeight = svgHeight - margin.top - margin.bottom;

const chart = svg
  .append('g')
  .attr('width', chartWidth)
  .attr('height', chartHeight)
  .attr('transform', `translate(${margin.left}, ${margin.top})`);

const xAxisGroup = chart
  .append('g')
  .attr('transform', `translate(0, ${chartHeight})`);
const yAxisGroup = chart.append('g');

const x = d3
  .scaleBand()
  .range([0, chartWidth])
  .paddingInner(0.2)
  .paddingOuter(0.2);
const y = d3.scaleLinear().range([chartHeight, 0]);

const xAxis = d3.axisBottom(x);
const yAxis = d3
  .axisLeft(y)
  .ticks(10)
  .tickFormat((d) => `${d} degrees`);

const update = (data) => {
  // Handle the scaling domains
  x.domain(data.map((item) => item.date));
  y.domain([0, d3.max(data, (d) => d.temp)]);

  const rects = chart.selectAll('rect').data(data);

  // Remove extra rects from the DOM
  rects.exit().remove();

  // Initial chart scaling and styling for entries
  rects
    .attr('width', x.bandwidth)
    .attr('x', (d) => x(d.date))
    .attr('fill', 'orange');

  // Chart scaling and styling for new entries
  rects
    .enter()
    .append('rect')
    .attr('width', x.bandwidth)
    .attr('height', 0)
    .attr('x', (d) => x(d.date))
    .attr('y', chartHeight)
    .attr('fill', 'orange')
    .merge(rects)
    .transition()
    .duration(1000)
    .attr('height', (d) => chartHeight - y(d.temp))
    .attr('y', (d) => y(d.temp));

  chart.selectAll('rect').on('click', handleClick);

  xAxisGroup.call(xAxis);
  yAxisGroup.call(yAxis);

  // Handle the chart label styling
  xAxisGroup
    .selectAll('text')
    .attr('text-anchor', 'end')
    .attr('transform', 'rotate(-40)')
    .attr('fill', 'black')
    .attr('font-size', '0.75rem');

  yAxisGroup
    .selectAll('text')
    .attr('text-anchor', 'end')
    .attr('fill', 'black')
    .attr('font-size', '0.75rem');
};

const handleClick = async (e, d) => {
  await deleteDoc(doc(db, 'weather', d.id));
};
