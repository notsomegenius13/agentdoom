const major = Number.parseInt(process.versions.node.split('.')[0], 10)

if (Number.isNaN(major)) {
  console.error('Unable to detect Node.js version.')
  process.exit(1)
}

if (major < 20 || major >= 23) {
  console.error(
    `Unsupported Node.js version ${process.versions.node}. Use Node 20.x or 22.x for Next.js 14 builds.`
  )
  process.exit(1)
}
