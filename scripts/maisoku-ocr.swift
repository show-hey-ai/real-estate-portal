// Free OCR for rendered maisoku pages with Apple Vision (macOS only, no paid API).
// Usage: swift scripts/maisoku-ocr.swift <directory of page PNGs> <output JSON>
// Output: [{ "file": "page-01.png", "lines": [{ "text", "confidence", "x", "y", "width", "height" }] }]
// Coordinates are Vision's normalised box (0–1, origin at the bottom left).
import Foundation
import Vision

struct Line: Codable { let text: String; let confidence: Float; let x: Double; let y: Double; let width: Double; let height: Double }
struct Page: Codable { let file: String; let lines: [Line] }

let arguments = CommandLine.arguments
guard arguments.count == 3 else {
  FileHandle.standardError.write("Usage: swift scripts/maisoku-ocr.swift <png directory> <output json>\n".data(using: .utf8)!)
  exit(2)
}
let directory = URL(fileURLWithPath: arguments[1])
let output = URL(fileURLWithPath: arguments[2])
let files = try FileManager.default.contentsOfDirectory(at: directory, includingPropertiesForKeys: nil)
  .filter { $0.pathExtension.lowercased() == "png" }
  .sorted { $0.lastPathComponent < $1.lastPathComponent }

var pages: [Page] = []
for file in files {
  let request = VNRecognizeTextRequest()
  request.recognitionLevel = .accurate
  request.recognitionLanguages = ["ja-JP", "en-US"]
  request.usesLanguageCorrection = false
  try VNImageRequestHandler(url: file).perform([request])
  let lines = (request.results ?? []).compactMap { observation -> Line? in
    guard let candidate = observation.topCandidates(1).first else { return nil }
    let box = observation.boundingBox
    return Line(text: candidate.string, confidence: candidate.confidence, x: box.origin.x, y: box.origin.y, width: box.size.width, height: box.size.height)
  }
  pages.append(Page(file: file.lastPathComponent, lines: lines))
  FileHandle.standardError.write("OCR \(file.lastPathComponent): \(lines.count) lines\n".data(using: .utf8)!)
}
try JSONEncoder().encode(pages).write(to: output, options: .atomic)
try FileManager.default.setAttributes([.posixPermissions: 0o600], ofItemAtPath: output.path)
