(() => {
  'use strict';

  /**
   * Export themes controller
   */
  class EditExportThemeController {

    /**
     * Constructor
     * 
     */
    constructor() {
      $(document).on("click", ".new-theme-file-btn", this.onNewThemeFileClick.bind(this));
      this.exportThemeId = $("*[name='export-theme-id']").val();
    }

    async onNewThemeFileClick(event) {
      const response = await fetch(`/ajax/admin/export-themes/${this.exportThemeId}/files/new`, {
        method: "POST"
      });

      const content = await response.json();
      
      window.location.href = `/admin/export-themes/${content.themeId}/files/${content.id}`;
    }

  }

  $(document).ready(() => {
    new EditExportThemeController();
  });

})();