export function Controls({
  index,
  total,
  seek,
  replay,
}: {
  index: number;
  total: number;
  seek: (n: number) => void;
  replay: () => void;
}) {
  return (
    <>
      {" "}
      <div className="controls">
        <button
          aria-label="最初から"
          onClick={() => {
            replay();
            seek(0);
          }}
        >
          最初から
        </button>
        <button disabled={index === 0} onClick={() => seek(index - 1)}>
          前へ
        </button>
        <button
          className="replay"
          aria-label="もう一度"
          onClick={() => {
            replay();
          }}
        >
          もう一度
        </button>
        <button
          className="next"
          disabled={index === total - 1}
          onClick={() => seek(index + 1)}
        >
          次へ
        </button>
        <button disabled={index === total - 1} onClick={() => seek(total - 1)}>
          最後に進む
        </button>
      </div>
      <div className="progress">
        <span style={{ width: `${((index + 1) / total) * 100}%` }} />
      </div>
    </>
  );
}
