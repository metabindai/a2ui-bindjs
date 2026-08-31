import SwiftUI

struct UnsupportedChartContentView: View {
    let componentName: String

    var body: some View {
        #if DEBUG
        Text("Unsupported chart content: \(componentName)")
            .font(.caption)
            .foregroundStyle(.secondary)
            .padding(8)
            .accessibilityLabel("Unsupported chart content")
            .accessibilityValue(componentName)
        #else
        EmptyView()
        #endif
    }
}
