(() => {
  'use strict';

  /**
   * Email notification controller
   */
  class EmailNotificationsController {

    /**
     * Constructor
     * 
     */
    constructor() {
      $(document).on("click", ".new-notification-btn", this.onNewNotificationClick.bind(this));
    }

    async onNewNotificationClick(event) {
      const response = await fetch("/ajax/admin/email-notifications/new", {
        method: "POST"
      });

      const content = await response.json();
      window.location.href = `/admin/email-notifications/${content.id}`;
    }

  }

  $(document).ready(() => {
    new EmailNotificationsController();
  });

})();