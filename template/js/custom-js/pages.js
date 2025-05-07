// Add your custom JavaScript for storefront pages here.
import EcomSearch from '@ecomplus/search-engine'

EcomSearch.dslMiddlewares.push((dsl) => {
  if (dsl.query && dsl.query.bool) {
    if (dsl.query.bool.filter) {
      dsl.query.bool.filter.forEach(fixCategoryIdsFilter)
    }
    if (dsl.query.bool.must) {
      dsl.query.bool.must.forEach((filter) => {
        if (filter.multi_match) {
          const { fields } = filter.multi_match
          if (Array.isArray(fields)) {
            fields.push('skus')
          }
        }
        fixCategoryIdsFilter(filter)
      })
    }
  }
})
