(() => {
  'use strict';

  /**
   * Returns a JSON from URL
   * 
   * @param {String} url url
   * @returns {Promise} promise for JSON 
   */
  const getJSON = (url) => {
    return new Promise((resolve, reject) => {
      $.getJSON(url, (data) => {
        resolve(data);
      })
      .fail((jqxhr, textStatus, error) => {
        reject(error || textStatus || "Error");
      })
    });
  }

  /**
   * Chart controller
   */
  class ChartController {

    /**
     * Constructor
     * 
     * @param {Element} parent parent element 
     */
    constructor(parent) {
      this.parent = parent;
      this.parent.height(this.parent.width());
      this.canvas = $('<canvas>').appendTo(this.parent);
      this.context = this.canvas[0].getContext('2d');
      this.chart = null;
    }

    /**
     * Loads a report
     * 
     * @param {String} slug report slug
     * @param {Object} options options
     */
    async loadReport(slug, options) {
      const chartData = await this.getChartData(slug, options || {});
      
      if (!this.chart) {
        this.chart = new Chart(this.context, chartData);
      } else {
        this.chart.type = chartData.type; 
        this.chart.data = chartData.data; 
        this.chart.options = chartData.options || {}; 
        this.chart.update();
      }
    }

    /**
     * Loads chart data
     * 
     * @param {String} slug 
     * @param {options} options
     * @returns {Promise} promise for chart data 
     */
    getChartData(slug, options) {
      const filters = options.filters || '';
      return getJSON(`/admin/getreportdata/${slug}?filters=${filters}`);
    }

    /**
     * Shows an error
     * 
     * @param {Error} error
     */
    showError(error) {
      alert(error);
    }
  }

  /**
   * Report controller
   */
  class ReportController {

    /**
     * Constructor
     * 
     * @param {Element} reportContainer 
     * @param {Element} filtersContainer 
     */
    constructor(reportContainer, filtersContainer) {
      this.filtersContainer = filtersContainer;
      this.chartController = new ChartController(reportContainer);
      this.chartController.loadReport(this.getSelectedReportSlug());
      
      $('select[name="report"]').change(this.onReportChange.bind(this));
      $(document).on("change", "form#report-filters input, form#report-filters select", this.onReportFilterChange.bind(this));

      this.renderFilters();
    }

    /**
     * Renders filters
     */
    async renderFilters() {
      const filters = await this.loadFilters();
      this.filtersContainer.html(renderReportFilters({
        filters: filters
      }));
    }

    /**
     * Loads filters
     * 
     * @returns {Promise} promise for filters
     */
    loadFilters() {
      const slug = this.getSelectedReportSlug();
      return getJSON(`/admin/getreportfilters/${slug}`);
    }

    /**
     * Returns selected report slug
     * 
     * @returns {String} selected report slug
     */
    getSelectedReportSlug() {
      return $('select[name="report"]').val();
    }

    /**
     * Report select change event handler
     */
    onReportChange() {
      const reportSlug = this.getSelectedReportSlug();
      window.location.search = `report=${reportSlug}`;
    }

    /**
     * Report filter change event handler
     */
    onReportFilterChange(event) {
      const formValues = $(event.target).closest("form")
        .serializeArray();

      const filters = {
        fields: formValues
          .filter(formValue => {
            return formValue.value !== '__ALL__'
          })
          .map((formValue) => {
            return `${formValue.name}:${formValue.value}`;
          })
      };

      this.chartController.loadReport(this.getSelectedReportSlug(), {
        filters: JSON.stringify(filters)
      });
    }

  }

  $(document).ready(() => {
    const reportController = new ReportController($('.report-container'), $('.filters-container'));
  });

})();