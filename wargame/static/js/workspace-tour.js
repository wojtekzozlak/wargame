function CreateTour(){
  return new Tour({
    steps: [
    {
      title: 'Hello Captain!',
      content: 'Welcome to your workspace. Here you can create, program and test pilots for our fleet.',
      placement: 'bottom',
      orphan: true,
      backdrop: true
    },
    {
      element: '#editor div.side-panel',
      title: 'Managing AIs',
      content: 'Here you can add, select and remove your AIs.<br/><br/>'
               + 'In order to add an AI specify its name and click "add". Then select it from the list.',
      placement: 'top',
      backdrop: true,
      backdropPadding: 10
    },
    {
      element: '#editor .ai-editor',
      title: 'Writing code',
      content: 'Editor allows you to write the AI code (using JavaScript). New AIs are pre-populated '
               + 'with sample code.<br/><br/>'
               + 'You can find available commands and examples in <a href="/help">manual</a>. '
               + 'Note that AI must be selected in order to edit it.',
      placement: 'top',
      backdrop: true,
      backdropPadding: 10
    },
    {
      element: '#editor div.controls',
      title: 'Saving your work',
      content: 'In order to save your work, just click "save".',
      placement: 'top',
      backdrop: true,
      backdropPadding: 10
    },
    {
      element: '.simulation',
      title: 'Testing your pilots',
      content: 'This part of your workspace is used to test your pilots.',
      placement: 'bottom',
      backdrop: true,
    },
    {
      element: '.simulation #players-picker',
      title: 'Picking pilots',
      content: 'Here you can pick AIs for the duel. Note there is nothing wrong with AI fighting with itself.',
      placement: 'left',
      backdrop: true,
      backdropPadding: 10
    },
    {
      element: '.simulation #players-picker input.compile',
      title: 'Starting match',
      content: 'In order to start the match, click on this button.<br/>',
      placement: 'left',
      backdrop: true,
      backdropPadding: 10,
      reflex: true
    },
    {
      element: '.simulation div.board',
      title: 'Watching match',
      content: 'Match will be displayed in this area. Note you can pan and zoom in/out using the mouse.<br/>',
      placement: 'bottom',
      backdrop: true,
      backdropPadding: 10,
    },
    {
      element: '.simulation div#controls',
      title: 'Pausing and replaying',
      content: 'Controls in the top right corner allows you to pause, resume and stop the match.<br/><br/>'
               + 'Note that stopping and starting the match will not change its course (e.g. when the AI is randomized).<br/><br/>'
               + 'If you want to recalculate the match use the compilation button.',
      placement: 'bottom',
      backdrop: true,
      backdropPadding: 10,
    },
    {
      element: '.ai-list',
      title: 'Selecting AI for contest',
      content: 'In order to participate in contest with other players you must select a single AI as your representant<br/><br/>'
               + 'To do so, click on the star near its name. Only a single AI may be selected!',
      placement: 'left',
      backdrop: true,
      packdropPadding: 10,
    },
    {
      element: '.manual',
      title: 'The Manual',
      content: 'The Manual contains all the information you need for programming your AI. '
               + 'You will find list of available commands there, as well as example snippets.',
      placement: 'bottom',
      backdrop: true,
      backdropPadding: 10,
    },
    {
      element: '.tour',
      title: 'Thanks!',
      content: 'That\'s all! You can always replay this tour by clicking on the "take the tour" link.',
      placement: 'bottom',
      backdrop: true,
      backdropPadding: 10,
    }
  ]});
}

