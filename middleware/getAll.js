module.exports = async (req, Obj, filter) => {
  let { page, itemsPerPage, search } = req.query;
  page ? (page = parseInt(page, 10)) : (page = 1);
  itemsPerPage
    ? (itemsPerPage = parseInt(itemsPerPage, 10))
    : (itemsPerPage = 10);
  if (search) filter = { ...filter, $text: { $search: search } };
  const objects = await Obj.find(filter)
    .skip((page - 1) * itemsPerPage)
    .limit(itemsPerPage);

  const totalItems = await Obj.countDocuments(filter);
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const items = objects.length;

  const pagination = { page, items, totalPages, totalItems };

  return {
    data: objects,
    pagination: pagination
  };
};
