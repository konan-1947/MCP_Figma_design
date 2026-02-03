 PHÂN LOẠI THEO KHẢ NĂNG KỸ THUẬTA. READ Operations (REST API)
Đọc dữ liệu từ Figma - có thể thực hiện từ bên ngoàiA1. File Operations

getFile(fileKey) - Lấy toàn bộ file structure
getFileNodes(fileKey, nodeIds) - Lấy specific nodes
getImages(fileKey, nodeIds, format, scale) - Export images
getImageFills(fileKey) - Lấy images trong fills
A2. Version Operations

getFileVersions(fileKey) - Lịch sử versions
getFileVersion(fileKey, version) - Specific version
A3. Comment Operations

getComments(fileKey) - Đọc comments
postComment(fileKey, message, clientMeta) - Tạo comment
deleteComment(fileKey, commentId) - Xóa comment
A4. Component & Style Operations

getTeamComponents(teamId) - Components trong team
getFileComponents(fileKey) - Components trong file
getComponentSets(fileKey) - Component sets
getTeamStyles(teamId) - Styles trong team
getFileStyles(fileKey) - Styles trong file
A5. Project Operations

getTeamProjects(teamId) - List projects
getProjectFiles(projectId) - Files trong project
A6. Variable Operations

getLocalVariables(fileKey) - Local variables
getPublishedVariables(fileKey) - Published variables
B. WRITE Operations (Plugin API only)
Tạo/sửa/xóa - CHỈ có thể thực hiện trong Figma pluginB1. Node Creation

createFrame()
createRectangle()
createEllipse()
createPolygon()
createStar()
createLine()
createText()
createComponent()
createComponentSet()
createInstance(componentId)
createSlice()
createVector()
createBooleanOperation()
B2. Node Modification

node.name - Đổi tên
node.x, node.y - Vị trí
node.resize(width, height) - Kích thước
node.rotation - Xoay
node.opacity - Độ trong suốt
node.blendMode - Blend mode
node.visible - Hiện/ẩn
node.locked - Khóa/mở khóa
B3. Style Modification

node.fills - Màu fill
node.strokes - Màu stroke
node.strokeWeight - Độ dày stroke
node.cornerRadius - Bo góc
node.effects - Shadow, blur effects
node.constraints - Constraints (auto-layout)
B4. Text Operations

textNode.characters - Nội dung text
textNode.fontSize - Font size
textNode.fontName - Font family
textNode.textAlignHorizontal - Căn chỉnh
textNode.textCase - Chữ hoa/thường
textNode.textDecoration - Gạch chân, gạch ngang
textNode.letterSpacing - Khoảng cách chữ
textNode.lineHeight - Line height
B5. Layout Operations

node.layoutMode - Auto layout mode (HORIZONTAL/VERTICAL/NONE)
node.primaryAxisSizingMode - Auto layout sizing
node.counterAxisSizingMode
node.paddingLeft/Right/Top/Bottom
node.itemSpacing - Khoảng cách items
node.layoutAlign - Alignment
node.appendChild(child) - Thêm child
node.insertChild(index, child) - Insert child
node.removeChild(child) - Xóa child
B6. Component Operations

createComponent() - Tạo component
createComponentSet() - Tạo variant set
componentNode.createInstance() - Tạo instance
instanceNode.swapComponent(component) - Đổi component
instanceNode.detachInstance() - Detach khỏi component
B7. Boolean Operations

union(nodes) - Hợp
subtract(nodes) - Trừ
intersect(nodes) - Giao
exclude(nodes) - Loại trừ
B8. Node Hierarchy

node.parent - Node cha
node.children - Node con
node.remove() - Xóa node
node.clone() - Nhân bản
B9. Selection & Navigation

figma.currentPage.selection - Các node đang chọn
figma.currentPage - Trang hiện tại
figma.root - Root document
figma.getNodeById(id) - Tìm node by ID
B10. Export Operations (Plugin có thể export trực tiếp)

node.exportAsync(settings) - Export PNG/JPG/SVG/PDF