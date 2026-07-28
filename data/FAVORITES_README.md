# Homepage slideshow favorites

The homepage always begins with the three photos listed under `openingTrio` in
`data/favorites.js`. The remaining photos in `pool` are shuffled into balanced
groups of three and kept in the same order for eight hours, so refreshing the
page does not constantly rearrange the experience. Desktop shows groups of
three, while mobile cycles through every favorite one image at a time.

To update the slideshow later:

1. Keep the image in its existing folder under `Images`.
2. Add its web path, descriptive alt text, and category to `pool` in
   `data/favorites.js`.
3. Keep the pool total divisible by three so every desktop set is complete.
4. Do not repeat an image already listed in `openingTrio` or `pool`.

The browser cannot automatically discover files inside an image folder on
GitHub Pages, so this manifest is the reliable source of truth.
