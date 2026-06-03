declare module 'piexifjs' {
  type Rational = [number, number];
  type DmsRational = [Rational, Rational, Rational];

  const ImageIFD: Record<string, number>;
  const ExifIFD: Record<string, number>;
  const GPSIFD: Record<string, number>;

  const GPSHelper: {
    degToDmsRational(deg: number): DmsRational;
    dmsRationalToDeg(dms: DmsRational, ref: string): number;
  };

  function load(data: string): Record<string, Record<number, any>>;
  function dump(exifObj: Record<string, Record<number, any>>): string;
  function insert(exifStr: string, jpegData: string): string;
  function remove(jpegData: string): string;
}
