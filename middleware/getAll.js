module.exports = async (req, Obj, filter) => {
  const page = parseInt(req.query.page, 10) || 1
  const itemsPerPage = parseInt(req.query.itemsPerPage, 10) || 10
  const objects = await Obj
    .find(filter)
    .skip((page - 1) * itemsPerPage)
    .limit(itemsPerPage)

  const totalItems = await Obj.countDocuments({})
  const totalPages = Math.floor((totalItems - 1)/itemsPerPage + 1)
  const items = objects.length 

  const pagination = { page, items, totalPages, totalItems}

  return {
    data: objects,
    pagination: pagination
  }

}