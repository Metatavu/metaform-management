(() => {
  'use strict';

  $(document).ready(() => {    
    const formContainer = $('.metaform-container');
    const formJson = JSON.parse(formContainer.attr('data-form'));
    const formValues = JSON.parse(formContainer.attr('data-form-values') || "{}");
    const action = formContainer.attr('data-action');

    $('.metaform-container').html(mfRender({
      viewModel: formJson,
      formValues: formValues
    }));

    $('.metaform-container form.metaform')
      .attr('data-action', action)
      .metaform({
        action: action,
        beforeFormSubmit: () => {
          $('.metaform-container form.metaform input[type="submit"]')
            .attr("disabled", "disabled");
        },
        onPostSuccess: () => {
          new Noty({
            timeout: 5000,
            text: "Lomake lähetettiin onnistuneesti",
            type: "success",
            callbacks: {
              onClose: () => {
                window.location.reload();
              }
            }
          }).show();
        },
        onPostError: (errorMessage, jqXHR) => {
          new Noty({
            timeout: 5000,
            text: errorMessage || "Failed to send the form",
            type: "error"
          }).show();
        }
      });
  });

})();