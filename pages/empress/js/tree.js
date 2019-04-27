class Tree{
  constructor(tree_nwk, metadata, headers, maxes){
    this.layout = "radial";
    this.tree = tree_nwk;
    this.edgeData = [];
    this.numBranches = 206020;

    this.metadata = metadata;
    this.headers = headers;
    this.max = maxes.dim;
    this.maxes = maxes;
    this.root = 'N1';


    //this.numBranches = this.edgeData.length;
    //console.log(this.numBranches);
    this.triData = [];
    this.triRoots = [];
    this.lastHighTri = 0;
    this.updateEdgeData(0);


  }

  order(pre, start, include_self, tip=false){
    let result = [];
    let tmp = [start];
    while(tmp.length !== 0){
      let curr = tmp.pop();
      if(include_self || start!==curr) {
        if (!tip || this.tree[curr].is_tip == "true"){
            result.push(curr);
        }
      }
      for (var i = 0; i < this.tree[curr].children.length; ++i){
        tmp.push(this.tree[curr].children[i]);
      }
    }
    if(pre){
      return result;
    }
    else{
      return result.reverse();
    }
  }

  coords(height, width){
    let scale = this.rescale(height,width);
    let centerX = this.tree[this.root].x;
    let centerY = this.tree[this.root].y;

    let postorder = this.order(false, 'N1', true);
    for (var i = 0; i < postorder.length; ++i){
        let node = this.tree[postorder[i]];
        node.x = node.x - centerX;
        node.y = node.y - centerY;
    }
  }

  updateCoordinates(s, x1, y1, a, da){
    let max_x = Number.MIN_VALUE;
    let min_x = Number.MAX_VALUE;
    let max_y = Number.MIN_VALUE;
    let min_y = Number.MAX_VALUE;

    //calculates self coords/angle
    //Constant angle algorithm.  Should add maximum daylight step.
    let length = this.tree[this.root].length;
    let x2 = x1 + length * s * Math.sin(a);
    let y2 = y1 + length * s * Math.cos(a);
    this.tree[this.root].x = x2;
    this.tree[this.root].y = y2;
    this.tree[this.root].angle = a;
    let preorder = this.order(true, 'N1', false);

    for(var i = 0; i < preorder.length; ++i){
        let nodeName = preorder[i];
        let node = this.tree[nodeName];
        let parentName = node.parent;
        let parent = this.tree[parentName];
        x1 = parent.x;
        y1 = parent.y;

        // init a
        a = parent.angle;

        // same modify across nodes
        a = a - parent.leafcount * da / 2;

        // check for conditional higher order
        for (var j = 0; j < parent.children.length; ++j){
            let sibName = parent.children[j];
            let sib = this.tree[sibName];
            if(sibName != nodeName){
                a += sib.leafcount * da
            } else {
                a += (node.leafcount * da) / 2;
                break;
            }
        }
        // Constant angle algorithm.  Should add maximum daylight step.
        x2 = x1 + node.length * s * Math.sin(a);
        y2 = y1 + node.length * s * Math.cos(a);
        node.x = x2;
        node.y = y2;
        node.angle = a;

        max_x = Math.max(max_x, x2);
        min_x = Math.min(min_x, x2);
        max_y = Math.max(max_y, y2);
        min_y = Math.min(min_y, y2);

    }
    return {"max_x": max_x,
            "min_x": min_x,
            "max_y": max_y,
            "min_y": min_y};
  }

  rescale(height, width){
    let angle = (2 * Math.PI) / this.tree[this.root].leafcount;

    let best_scale = 0;
    let best_args = {};
    for(var i = 0; i < 60; ++i){
        let direction = i / 60.0 * Math.PI;
        let result = this.updateCoordinates(
            1.0, 0, 0, direction, angle);

        let x_diff = result.max_x - result.min_x;
        let width_min = 0
        if(x_diff !== 0){
            width_min = width / x_diff;
        }
        let y_diff = result.max_y - result.min_y;
        let height_min = 0
        if(y_diff != 0){
            height_min = height / y_diff;
        }
        let scale = Math.min(width_min, height_min);

        scale *= 0.95
        if(scale > best_scale){
            best_scale = scale;
            let mid_x = width / 2 - ((result.max_x + result.min_x) / 2) * scale;
            let mid_y = height / 2 - ((result.max_y + result.min_y) / 2) * scale;
            best_args = { "scale": scale,
                          "mid_x": mid_x,
                          "mid_y": mid_y,
                          "direction": direction,
                          "angle": angle};
        }
    }
    this.updateCoordinates(best_args.scale,
                       best_args.mid_x,
                       best_args.mid_y,
                       best_args.direction,
                       best_args.angle);
    return best_scale;
  }

  collapse(taxLevel, taxPrefix) {
    let prefix = this.layout.charAt(0) + "_";
    const RED = 0;
    const GREEN = 1;
    const BLUE = 2;
    let r, g, b;
    let preorder = this.order(true, this.root, false);
    let i;
    let collapsedNodes = 0;
    let node;
    let rootNode;
    let rx, ry, tlX, tlY, trX, trY, theta;
    this.triData = [];
    this.triRoots = [];
    for(i = 0; i < preorder.length; i++) {
        this.metadata[preorder[i]]['branch_is_visible'] = true;
    }
    for(node in this.metadata) {
        if(this.metadata[node][taxPrefix + taxLevel] != null) {
            preorder = this.order(true, node, false);
            for(i = 0; i < preorder.length; i++) {
                this.metadata[preorder[i]]['branch_is_visible'] = false;
                collapsedNodes += 1;
            }
            rootNode = this.tree[node];
            theta = rootNode['starting_angle'];
            rx = rootNode[prefix+"x"];
            ry = rootNode[prefix+"y"];
            tlX = rootNode["largest_branch"] * Math.cos(theta) + rx;
            tlY = rootNode["largest_branch"] * Math.sin(theta) + ry;
            theta += rootNode["theta"];
            trX = rootNode["smallest_branch"] * Math.cos(theta) + rx;
            trY = rootNode["smallest_branch"] * Math.sin(theta) + ry;
            r = this.metadata[node]['branch_color'][RED];
            g = this.metadata[node]['branch_color'][GREEN];
            b = this.metadata[node]['branch_color'][BLUE];
            this.triData.push(rx);
            this.triData.push(ry);
            this.triData.push(r);
            this.triData.push(g);
            this.triData.push(b);
            this.triData.push(tlX);
            this.triData.push(tlY);
            this.triData.push(r);
            this.triData.push(g);
            this.triData.push(b);
            this.triData.push(trX);
            this.triData.push(trY);
            this.triData.push(r);
            this.triData.push(g);
            this.triData.push(b);
            this.triRoots.push(node);
        }
    }
    this.updateEdgeData(collapsedNodes);
    return this.edgeData;
  }

  uncollapse() {
    let preorder = this.order(true, this.root, false);
    let i;
    let collapsedNodes = 0;
    const NON_HIDDEN = 0
    this.triData = [];
    this.triRoots = [];
    for(i = 0; i < preorder.length; i++) {
        this.metadata[preorder[i]]['branch_is_visible'] = true;
    }
    this.updateEdgeData(NON_HIDDEN);
    return this.edgeData;
  }

  updateEdgeData(numNotVis) {
    let prefix = this.layout.charAt(0)+"_";
    let i = 0;
    let node;
    const VERT_SIZE = 10;
    const PX = 0;
    const PY = 1;
    const PR = 2;
    const PG = 3;
    const PB = 4;
    const X = 5;
    const Y = 6;
    const R = 7;
    const G = 8;
    const B = 9;
    const RED = 0;
    const GREEN = 1;
    const BLUE = 2;
    const SEGX2 = 0;
    const SEGY2 = 1;
    const SEGX1 = 2;
    const SEGY1 = 3;
    let nodeMetadata;
    this.edgeData = new Array((this.numBranches ) * VERT_SIZE);
    for(node in this.metadata) {

        nodeMetadata = this.metadata[node];
        if(nodeMetadata['branch_is_visible']) {

            this.edgeData[i + PX] = nodeMetadata[prefix+"px"];
            this.edgeData[i + PY] = nodeMetadata[prefix+"py"];
            this.edgeData[i + PR] = nodeMetadata["branch_color"][RED];
            this.edgeData[i + PG] = nodeMetadata["branch_color"][GREEN];
            this.edgeData[i + PB] = nodeMetadata["branch_color"][BLUE];
            this.edgeData[i + X] = nodeMetadata[prefix+"x"];
            this.edgeData[i + Y] = nodeMetadata[prefix+"y"];
            this.edgeData[i + R] = nodeMetadata["branch_color"][RED];
            this.edgeData[i + G] = nodeMetadata["branch_color"][GREEN]
            this.edgeData[i + B] = nodeMetadata["branch_color"][BLUE]
            i += VERT_SIZE;
            // Add segments as well
            //console.log(nodeMetadata["c_segments"]);
            if(this.layout=="circular" && nodeMetadata["c_segments"].length != 0){
              //console.log("segments");
              let seg;
              for (var j = 0; j < nodeMetadata["c_segments"].length; ++j){
                seg = nodeMetadata["c_segments"][j];
                this.edgeData[i + PX] = seg[SEGX2];
                this.edgeData[i + PY] = seg[SEGY2];
                this.edgeData[i + PR] = nodeMetadata["branch_color"][RED];
                this.edgeData[i + PG] = nodeMetadata["branch_color"][GREEN];
                this.edgeData[i + PB] = nodeMetadata["branch_color"][BLUE];
                this.edgeData[i + X] = seg[SEGX1];
                this.edgeData[i + Y] = seg[SEGY1];
                this.edgeData[i + R] = nodeMetadata["branch_color"][RED];
                this.edgeData[i + G] = nodeMetadata["branch_color"][GREEN]
                this.edgeData[i + B] = nodeMetadata["branch_color"][BLUE]
                i += VERT_SIZE;
              }
            }

        }
    }
  }

  getTaxonLabels(taxLevel, tips, taxPrefix, sort) {
    let prefix = this.layout.charAt(0)+"_";
    let labels = [];
    let node;
    for(node in this.metadata) {
      if(this.metadata[node][taxPrefix + taxLevel] != null
            && this.tree[node]["is_tip"] === tips
            && this.metadata[node]["branch_is_visible"]) {
        labels.push([this.metadata[node][prefix+"x"],
                         this.metadata[node][prefix+"y"],
                         this.metadata[node][taxLevel],
                         this.tree[node]["leafcount"],
                         node]);
      }
    }
    labels.sort(sort);
    return labels;
  }

  triangleAt(x,y) {
    const TRI_SIZE = 15;
    const CX = 0, CY = 1, LX = 5, LY = 6, RX = 10, RY = 11;
    let i = 0;
    let triangle = {}, a = {}, b = {}, c = {}, result = {};
    while(i < this.triData.length) {
        a.x = this.triData[i + CX];
        a.y = this.triData[i + CY];
        b.x = this.triData[i + LX];
        b.y = this.triData[i + LY];
        c.x = this.triData[i + RX];
        c.y = this.triData[i + RY];
        triangle.area = this.triangleArea(a, b, c);
        triangle.s1 = this.triangleArea({'x': x, 'y': y}, b, c);
        triangle.s2 = this.triangleArea(a, {'x': x, 'y': y}, c);
        triangle.s3 = this.triangleArea(a, b, {'x': x, 'y': y});
        if(Math.abs(triangle.area - triangle.s1 - triangle.s2 - triangle.s3) < 0.0001) {
            result.id = this.triRoots[i / TRI_SIZE];
            result.tri = this.setTriHighlight(i);
            return result;
        }
        i += TRI_SIZE;
    }
    return null;
  }

  setTriHighlight(idx) {
    const TRI_SIZE = 15;
    const CX = 0, CY = 1, LX = 5, LY = 6, RX = 10, RY = 11;
    const CR = 2, CG = 3, CB = 4, LR = 7, LG = 8, LB = 9, RR = 12, RG = 13, RB = 14;
    const RED = 0.62890625, GREEN = 0.84765625, BLUE = 0.60546875;
    let tri = new Array(TRI_SIZE);
    tri[CX] = this.triData[idx + CX];
    tri[CY] = this.triData[idx + CY];
    tri[CR] = RED;
    tri[CG] = GREEN;
    tri[CB] = BLUE;
    tri[LX] = this.triData[idx + LX];
    tri[LY] = this.triData[idx + LY];
    tri[LR] = RED;
    tri[LG] = GREEN;
    tri[LB] = BLUE;
    tri[RX] = this.triData[idx + RX];
    tri[RY] = this.triData[idx + RY];
    tri[RR] = RED;
    tri[RG] = GREEN;
    tri[RB] = BLUE;
    return tri;
  }
  triangleArea(a, b, c) {
    return Math.abs((a.x*(b.y - c.y) + b.x*(c.y - a.y) + c.x*(a.y - b.y)) / 2)
  }

  /*
   * directs to appropriate coloring function based on category
   * @ param {string} category - default || the category from metadata to color from
   * @ param (string) nodeType - "G" == tip, "N" == nodes
  */
  colorBranches(category, nodeType) {
    let i = 0;
    let result = {};
    let keyInfo = {};
    if (category === "default") {
        this.colorTreeDefault();
    }
    else if (category === "(preset)"){
        keyInfo = this.colorTreePreset();
        result["keyInfo"] = keyInfo;
        result["gradient"] = false;
    }
    else if (this.headers.tip_num.includes(category) || this.headers.node_headers.includes(category)) {
        keyInfo = this.colorTreeGradient(category, nodeType);
        result["keyInfo"] = keyInfo;
        result["gradient"] = true;
    }
    else {
        keyInfo = this.colorTreeCategorical(category, nodeType);
        result["keyInfo"] = keyInfo;
        result["gradient"] = false;
    }
    this.updateEdgeData(0);
    result["edgeData"] = this.edgeData;
    return result;
  }

  /*
   * Colors the entire tree using the default color
  */
  colorTreeDefault() {
    let i, color = this.getDefaultColor();
    for(i in this.metadata) {
        this.metadata[i]['branch_color'] = color;
    }
  }

  /*
   * Colors the tree using the preset color map
  */
  colorTreePreset() {
    let i, value, color, keyInfo = {};
    for(i in this.metadata) {
        value = this.metadata[i]["color_pal"];
        color = this.getColorPal(value);
        keyInfo[value] = this.getColorHexCode(color);
        this.metadata[i]['branch_color'] = color;
    }
    return keyInfo;
  }

  /*
   * Colors the tree using a gradient color map
   * @ param {string} category - numerical column in this.metadata
   * @ param (string) nodeType - "G" == tip, "N" == nodes
  */
  colorTreeGradient(category, nodeType) {
    let i, keyInfo = {};
    let prefix = (nodeType === "G") ? "g_" : "n_";
    let min = this.maxes[prefix + category][0];
    let max = this.maxes[prefix + category][1];
    let interpolator = this.getColorInterp(min, max, "YlOrRd");
    keyInfo = {
        "min": [min, interpolator(min).hex()],
        "max": [max, interpolator(max).hex()]
    };
    for (i in this.metadata) {
        if (!(category in this.metadata[i]) || this.metadata[i]["Node_id"].indexOf(nodeType) === -1) {
          continue;
        }
        if (this.metadata[i][category] !== null){
            this.metadata[i]['branch_color'] = interpolator(this.metadata[i][category])
                                                    .rgb()
                                                    .map(x => x / 256);
        }
    }
    return keyInfo;
  }

  /*
   * colors the tree using categorical data . This will assign a unique color to
   * the 8th largest groups within the category and remaining will be colored
   * using a "others" color.
   * @ param{string} category - categorical column in this.metadata
   * @ param (string) nodeType - "G" == tip, "N" == nodes
  */
  colorTreeCategorical(category, nodeType) {
    let i, keyInfo = {}, cats = {};
    let group;

    // extract unique groups within the category and count number of time each group appears
    for (i in this.metadata) {
        if (!(category in this.metadata[i]) || this.metadata[i]["Node_id"].indexOf(nodeType) === -1) {
          continue;
        }
        group = this.metadata[i][category];
        if (group in cats) {
            cats[group] += 1;
        }
        else {
            cats[group] = 0;
        }
    }

    // sort groups by decreasing order
    let groups = Object.keys(cats)
                       .map( x => [x, cats[x]])
                       .sort(function (a, b) {return a[1] < b[1]});

    // assign largest 8 groups unique color and make the reset a single color
    for (i = 0; i < groups.length; i++) {
      if (i < 9) {
        cats[groups[i][0]] = i;
      }
      else {
        cats[groups[i][0]] = 9;
      }
    }

    // color each group
    let min = 0, max = (groups.length  < 9) ? groups.length : 9;
    let interpolator = this.getColorInterp(min, max, "set2");
    for (i in this.metadata) {
        if (!(category in this.metadata[i]) || this.metadata[i]["Node_id"].indexOf(nodeType) === -1) {
          continue;
        }
        if (this.metadata[i][category] !== null){
            group = this.metadata[i][category];
            keyInfo[group] = interpolator(cats[group]).hex();
            this.metadata[i]['branch_color'] = (cats[group] < 9) ? interpolator(cats[group])
                                                                      .rgb()
                                                                      .map(x => x / 256)
                                                                  : this.getDefaultColor();
        }
    }

    // mark smaller groups as "other"
    let key;
    if (groups.length > 8 ) {
      for (key in cats) {
        if (cats[key] > 8) {
          delete keyInfo[key];
        }
      }
      keyInfo["other"] = this.getColorHexCode(this.getDefaultColor());
    }

    return keyInfo;
  }

  /*
   * Returns the hex string that represents a rbg array
   * @param {array} colorArray - an rbg array whose entries are between 0 and 1
  */
  getColorHexCode(colorArray) {
    const RED = 0, GREEN = 1, BLUE = 2, BASE_HEX = 16, LARGEST_COLOR = 256;
    let hexString = (colorArray[RED] * LARGEST_COLOR).toString(BASE_HEX)
        + (colorArray[GREEN] * LARGEST_COLOR).toString(BASE_HEX)
        + (colorArray[BLUE] * LARGEST_COLOR).toString(BASE_HEX);
    // return (hexString.length < 6) ? "#" + hexString + "0" : hexString;
    return "#" + hexString;
  }

  /*
   * Returns the rgb array of the default color for the tree
  */
  getDefaultColor() {
    return [0.69921875, 0.69921875, 0.69921875];
  }

    /**
     * Creates a color interpreter for a color scale.
     * @param {number} min - the smallest value for the color map
     * @param {number} max - the largest value for the color map
     * @param {string} colorMap the color map to be used
    */
  getColorInterp(min, max, colorMap) {
    let colors = chroma.brewer[colorMap];
    return chroma.scale(colors).domain([min, max]);
  }

  /**
   * The color map for preset
   * @param {string} a catergor from preset
  */
  getColorPal(val) {
    let colors = {
        'Eukaryota': [0.94140625, 0.90234375, 0.609375],
        'Archaea': [0.65625, 0.62109375, 0.7890625],
        'Asgard': [0.44140625, 0.33984375, 0.625],
        'TACK': [0.74609375, 0.53515625, 0.6328125],
        'Crenarchaeota': [0.578125, 0.35546875, 0.58984375],
        'Euryarchaeota': [0.55078125, 0.48828125, 0.765625],
        'DPANN': [0.41015625, 0.375, 0.55859375],
        'CPR': [0.9140625, 0.75390625, 0.72265625],
        'Microgenomates': [0.8828125, 0.53125, 0.57421875],
        'Parcubacteria': [0.88671875, 0.62109375, 0.515625],
        'Eubacteria': [0.6875, 0.875, 0.87890625],
        'Terrabacteria': [0.625, 0.71484375, 0.875],
        'Actinobacteria': [0.48828125, 0.55859375, 0.78125],
        'Firmicutes': [0.12109375, 0.19140625, 0.46484375],
        'Chloroflexi': [0.28125, 0.37890625, 0.6953125],
        'Cyanobacteria': [0.34765625, 0.55859375, 0.875],
        'Spirochaetes': [0.44140625, 0.609375, 0.6875],
        'PVC': [0.78125, 0.83984375, 0.8125],
        'Chlamydiae': [0.6015625, 0.75390625, 0.7265625],
        'FCB': [0.66796875, 0.82421875, 0.90625],
        'Bacteroidetes': [0.38671875, 0.65625, 0.828125],
        'Proteobacteria': [0.31640625, 0.45703125, 0.62109375]
    }
    return colors[val];
  }

  getGenomeIDs(nodeId){
    let node = this.tree[nodeId];

    // If the node is a tip
    if(node.children.length == 0){
      return [nodeId];
    } else {
      return this.order(true, nodeId, false, true);
    }
  }

  /**
   * Generate newick format string based on the subtree rooted at nodeId
   */
  toNewick(nodeId){
    let node = this.tree[nodeId];
    let result = [];
    let resultStr = nodeId + ":" + node.length;
    // Base case
    if (node.children.length == 0) return resultStr;
    for (var i = 0; i < node.children.length; i++){
      let child = node.children[i];
      result.push(this.toNewick(child));
    }
    return '(' + result.join(',') + ')' + resultStr;
  }

 /**
  * Get the coordinates given the id of a node
  */
  getCoordinateByID(nodeId, parent=false){
    let prefix = this.layout.charAt(0) + "_";
    if(parent){
      prefix += "p";
    }
    if(nodeId == this.root) return [this.tree[nodeId].x, this.tree[nodeId].y]
    return [this.metadata[nodeId][prefix+"x"], this.metadata[nodeId][prefix+"y"]]
  }

  getMax(){
    if(this.layout == "radial") return this.maxes.dim;
    if(this.layout == "circular") return this.maxes.dim_circ;
  }

}
