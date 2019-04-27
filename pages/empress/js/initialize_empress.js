function initialize(){
  $(".metadata-container").hide();
  console.log('Start')

  // grab tree coord info from tree, this will be used to intialize WebGl
  drawingData.nodeCoords = [0, 0, 0, 0, 0];
  drawingData.highTri = [];
  drawingData.numBranches = tree.edgeData.length;
  console.log(drawingData.numBranches);
  drawingData.initZoom = tree.max;
  drawingData.currentZoom = drawingData.initZoom;

  // Fill 'Tip color' drop down menu
  /*fillDropDownMenu(tree.headers.general, "#tip-color-options");
  console.log('Start')
  fillDropDownMenu(tree.headers.tip_cat, "#tip-color-options");
  console.log('Start')
  fillDropDownMenu(tree.headers.tip_num, "#tip-color-options");
  console.log('Start')

  // File 'Node color' drop down menu
  fillDropDownMenu(tree.headers.general, "#branch-color-options");
  console.log('Start')
  fillDropDownMenu(tree.headers.node_headers, "#branch-color-options");
  console.log('Start')*/

  // TODO: create clade coloring drop box
  // fillDropDownMenu(tree.m_headers.all, '#clade-options');

  $("#show-metadata").prop('checked', true);

  // intializes webgl and creates callback events for users inputs
  initWebGl(tree.edgeData);
  console.log("after webgl");
  initCallbacks();
  //console.log("after callback");
  setPerspective();
  //console.log("after setPerspective");
  requestAnimationFrame(loop);
  //console.log("after loop");
}
