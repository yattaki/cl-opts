import typescript from '@rollup/plugin-typescript'

export default [
  {
    plugins: [
      typescript({ noEmitOnError: false })
    ],
    input: 'src/index.ts',
    output: {
      dir: 'dist',
      format: 'cjs',
      sourcemap: true
    },
    external: [
      'path',
      'source-map-support'
    ]
  }
]
