// Add your custom JavaScript for storefront pages here.
import EcomSearch from '@ecomplus/search-engine'

const fixCategoryIdsFilter = ({ terms }) => {
  if (
    terms &&
    terms['categories.name'] &&
    /^[0-9a-f]{24}$/.test(terms['categories.name'][0])
  ) {
    terms['categories._id'] = terms['categories.name']
    delete terms['categories.name']
  }
}

// Inspecionando o objeto DSL para debug
const logDsl = (dsl) => {
  console.log('DSL before modification:', JSON.stringify(dsl, null, 2));
}

EcomSearch.dslMiddlewares.push((dsl) => {
  // Opcional: Para debug
  // logDsl(dsl);
  
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
  
  // Remover o limite de especificações - abordagem mais abrangente
  if (dsl.aggs) {
    console.log('Removing size limit from specs aggregations',dsl.aggs);
    // Para cada agregação no DSL
    Object.keys(dsl.aggs).forEach(key => {
      // Verificar se é uma agregação de specs (verificando tanto pelo nome quanto pela estrutura)
      if ((key.startsWith('specs') || key === 'brands' || key === 'categories') && dsl.aggs[key]) {
        // Se tiver terms, aumentar o size
        if (dsl.aggs[key].terms) {
          // Definir um valor muito alto para garantir que todos os valores sejam retornados
          dsl.aggs[key].terms.size = 10000;
        }
        
        // Verificar se há nested aggs e ajustá-las também
        if (dsl.aggs[key].aggs) {
          Object.keys(dsl.aggs[key].aggs).forEach(nestedKey => {
            if (dsl.aggs[key].aggs[nestedKey].terms) {
              dsl.aggs[key].aggs[nestedKey].terms.size = 10000;
            }
            if (dsl.aggs[key].aggs[nestedKey].aggs) {
              dsl.aggs[key].aggs[nestedKey].aggs.text.terms.size = 10000;
            }
          });
        }
      }
    });
    console.log('Removing size limit from specs aggregations',dsl.aggs);
  }
  
  // Opcional: Para debug
  // console.log('DSL after modification:', JSON.stringify(dsl, null, 2));
})