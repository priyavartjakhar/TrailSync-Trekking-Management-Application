<template>
  <div class="admin-chart-frame" :style="{ height: normalizedHeight }">
    <canvas ref="canvas" :aria-label="label" role="img"></canvas>
  </div>
</template>

<script>
import Chart from 'chart.js/auto';

export default {
  name: 'AdminChart',
  props: {
    config: { type: Object, required: true },
    height: { type: [Number, String], default: 260 },
    label: { type: String, default: 'Analytics chart' }
  },
  computed: {
    normalizedHeight() {
      return typeof this.height === 'number' ? `${this.height}px` : this.height;
    }
  },
  watch: {
    config: {
      deep: true,
      handler() {
        this.renderChart();
      }
    }
  },
  mounted() {
    this.renderChart();
  },
  beforeUnmount() {
    this.destroyChart();
  },
  methods: {
    destroyChart() {
      if (this.chart) {
        this.chart.destroy();
        this.chart = null;
      }
    },
    renderChart() {
      this.destroyChart();
      if (!this.$refs.canvas || !this.config) return;

      const baseOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 450 },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 10,
              boxHeight: 10,
              color: '#4d5a4d',
              font: { family: 'Inter, sans-serif', size: 11, weight: 600 }
            }
          },
          tooltip: {
            backgroundColor: '#1a2e1a',
            borderColor: '#c8922a',
            borderWidth: 1,
            titleColor: '#ffffff',
            bodyColor: '#f3e5ab',
            padding: 10
          }
        },
        scales: {
          x: {
            ticks: { color: '#6b746b', font: { size: 10 } },
            grid: { color: 'rgba(26, 46, 26, 0.07)' }
          },
          y: {
            beginAtZero: true,
            ticks: { color: '#6b746b', precision: 0, font: { size: 10 } },
            grid: { color: 'rgba(26, 46, 26, 0.07)' }
          }
        }
      };

      const options = this.config.options || {};
      this.chart = new Chart(this.$refs.canvas, {
        ...this.config,
        options: {
          ...baseOptions,
          ...options,
          plugins: {
            ...baseOptions.plugins,
            ...(options.plugins || {})
          },
          scales: options.scales || baseOptions.scales
        }
      });
    }
  }
};
</script>
