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
      let chartData = await this.getChartData(slug, options || {});
      chartData = this.processCustomOptions(chartData);
      if (!this.chart) {
        this.chart = new Chart(this.context, chartData);
      } else {
        this.chart.destroy();
        this.chart = new Chart(this.context, chartData);
      }
    }

    /**
     * Process custom options if there is any
     * 
     * @param {Object} chartData
     */
    processCustomOptions(chartData) {
      chartData.options.scales.yAxes.forEach((y) => {
        if (y.ticks.customTicks) {
          const customTicks = y.ticks.customTicks;
          y.ticks.callback = (value, index, values) => {
            return customTicks[index];
          };
        }
      });
      
      return chartData;
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
      this.initFlatpickrs();
    }

    /**
     * Initialize flatpickr
     */
    initFlatpickrs() {
      $(".time-filter").flatpickr({
        "locale": "fi",
        "altFormat": "d.m.Y",
        "altInput": true,
        "utc": true,
        "allowInput": true
      });
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
      const form = $(event.target).closest("form");

      const fieldValues = form.find(".field-filter").map((index, fieldFilter) => {
        const name = $(fieldFilter).attr('name');
        const value = $(fieldFilter).val();

        return {
          value: value,
          name: name
        };
      }).toArray();

      const timeValues = form.find(`.time-filter[type="hidden"]`).map((index, timeFilter) => {
        if ($(timeFilter).val().length <= 0) {
          return;
        }
        
        return {
          value: $(timeFilter).val(),
          name: $(timeFilter).attr('name')
        };
      }).toArray();

      const filters = {
        createdBefore: timeValues
          .filter((timeValue) => {
            return timeValue.name === "createdBefore" && timeValue.value.length > 0;
          })
          .map((timeValue) => {
            return moment(timeValue.value).toISOString();
          }),
        createdAfter: timeValues
          .filter((timeValue) => {
            return timeValue.name === "createdAfter";
          })
          .map((timeValue) => {
            return moment(timeValue.value).toISOString();
          }),
        fields: fieldValues
          .filter((fieldValue) => {
            return fieldValue.value !== '__ALL__'
          })
          .map((fieldValue) => {
            return `${fieldValue.name}:${fieldValue.value}`;
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