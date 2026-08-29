//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'chapter_error_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class ChapterErrorResponse {
  /// Returns a new [ChapterErrorResponse] instance.
  ChapterErrorResponse({

     this.error,
  });

  @JsonKey(
    
    name: r'error',
    required: false,
    includeIfNull: false,
  )


  final String? error;





    @override
    bool operator ==(Object other) => identical(this, other) || other is ChapterErrorResponse &&
      other.error == error;

    @override
    int get hashCode =>
        error.hashCode;

  factory ChapterErrorResponse.fromJson(Map<String, dynamic> json) => _$ChapterErrorResponseFromJson(json);

  Map<String, dynamic> toJson() => _$ChapterErrorResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

