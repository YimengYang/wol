function initialize(){
  $(".metadata-container").hide();
  console.log('Start')
  drawingData.nodeCoords = [0, 0, 0, 0, 0];
  drawingData.highTri = [];
  drawingData.numBranches = tree.edgeData.length;
  console.log(drawingData.numBranches);
  drawingData.initZoom = tree.max;
  drawingData.currentZoom = drawingData.initZoom;
  fillDropDownMenu(tree.m_headers.numeric, "#tip-color-options");
  fillDropDownMenu(tree.m_headers.cat, "#branch-color-options");
  // fillDropDownMenu(tree.m_headers.all, '#clade-options');

  $("#show-metadata").prop('checked', true);
  initWebGl(tree.edgeData);
  //console.log("after webgl");
  initCallbacks();
  //console.log("after callback");
  setPerspective();
  //console.log("after setPerspective");
  requestAnimationFrame(loop);
  //console.log("after loop");
}
