(() => {
  "use strict";

  $(document).ready(() => {
    $('.codemirror').each((index, codemirror) => {
      const mode = $(codemirror).attr("data-mode");
      CodeMirror.fromTextArea(codemirror, {
        lineNumbers: true,
        mode: mode
      });
    });
  });

})();