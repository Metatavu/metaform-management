(() => {
  'use strict';

  /**
   * Export themes controller
   */
  class ExportThemesController {

    /**
     * Constructor
     * 
     */
    constructor() {
      $(document).on("click", ".new-theme-btn", this.onNewThemeClick.bind(this));
    }

    async onNewThemeClick(event) {
      const response = await fetch("/ajax/admin/export-themes/new", {
        method: "POST"
      });

      const content = await response.json();
      window.location.href = `/admin/export-themes/${content.id}`;
    }

  }

  $(document).ready(() => {
    new ExportThemesController();
  });

})();