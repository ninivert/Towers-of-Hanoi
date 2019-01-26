# Hanoi towers video builder

![Example of a frame generated](hanoi_example.png)

[Live codepen demo](https://codepen.io/ninivert/full/xMZogK)

## Recent changes

- Optimizations: only generate the frames _needed_ for the timelapse
- Added iteration counter on the top left side
- Added counter rendering
- Made the code much worse and applied KEIOFAWTWB (Keep Everything In One File And Watch The World Burn) tactic

## Frame generation: `node.js`

Having installed `node.js`, run `npm install` to install the required packages.\
Then run the following command to generate the frames:

```bash
node index.js <argument>=<value>
```

Where the arguments can be:

| Argument | Defaults to | Description |
| --- | --- | --- |
| `layers` | 3 | Number of layers of the Hanoi towers |
| `duration` | 60 | In seconds, the duration of the timelapse |
| `fps` | 30 | Expected framerate of the timelapse |
| `counter_display` | false | Boolean, display state of the iteration counter |
| `counter_render` | false | Boolean, render counter frames separately |
| `counter_size` | 50 | Size of the counter |
| `counter_font` | Arial | Font of the counter |
| `scaling` | 1 | Resolution of the frames, relative to the base (see lines 89 to 104) |
| `forcefirst` | 1 | Force render the first `n` iterations |
| `forcelast` | 1 | Force render the last `n` iterations |

The script will not generate duplicate frames to preserve efficiency, so the generated number of frames can be lower than the expected number of frames (`fps * duration`).

Modify scene padding, colours, etc. in the `index.js` files (it's in a big block of constants somewhere).

## Video compilation: `ffmpeg`

After having first ran the node script you can compile the individual frames to a video, run:

```bash
ffmpeg -framerate 30 -f image2 -i "hanoi_imgs/hanoi_%01d.png" -vcodec libx264 video_out/hanoi.mp4
# And for the counter
ffmpeg -framerate 30 -f image2 -i "counter_imgs/counter_%01d.png" -vcodec libx264 video_out/counter.mp4
```

_Warning: be sure to clear the `hanoi_imgs` directory each render, as `ffmpeg` will target every generated frame, even those that have not been overwritten_