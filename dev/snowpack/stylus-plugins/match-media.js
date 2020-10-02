module.exports = function () {
  return function (style) {
    style.define('match-media-string', function (size, inclusivity) {
      size = size.string
      inclusivity = inclusivity.string

      const sizeMap = new Map()
      const sizes = ['narrow', 'thin', 'small', 'normal', 'wide']
      const sizesPx = {
        thin: 400,
        small: 800,
        normal: 1000,
        wide: 1400
      }
      // This makes our map associated both ways:
      // 0 = thin, thin = 0.
      for (var i = 0; i < sizes.length; i++) {
        sizeMap.set(sizes[i], i)
        sizeMap.set(i, sizes[i])
      }
      const sizeIndex = sizeMap.get(size)

      let string = ''
      switch (inclusivity) {
        case 'only': {
          // If our size specified is the smallest available, then we can't use min-width.
          const min =
            sizeIndex === 0 ? '' : '(min-width: ' + sizesPx[size] + 'px)'

          // If our specified size is the largest available, then we can't use max-width.
          const max =
            sizeIndex === sizes.length - 1
              ? ''
              : '(max-width: ' +
                (sizesPx[sizeMap.get(sizeIndex + 1)] - 1) +
                'px)'

          // If both min and max are used: we add our 'and' for the media query.
          const and = min !== '' && max !== '' ? ' and ' : ''

          string = min + and + max

          break
        }
        case 'up': {
          if (sizeIndex === 0) break

          string = '(min-width: ' + sizesPx[size] + 'px)'

          break
        }
        case 'below': {
          if (sizeIndex === sizes.length - 1) break

          string =
            '(max-width: ' + (sizesPx[sizeMap.get(sizeIndex + 1)] - 1) + 'px)'

          break
        }
      }
      return string
    })
  }
}
