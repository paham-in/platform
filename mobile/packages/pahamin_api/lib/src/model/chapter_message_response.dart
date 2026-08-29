//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'chapter_message_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class ChapterMessageResponse {
  /// Returns a new [ChapterMessageResponse] instance.
  ChapterMessageResponse({

     this.message,
  });

  @JsonKey(
    
    name: r'message',
    required: false,
    includeIfNull: false,
  )


  final String? message;





    @override
    bool operator ==(Object other) => identical(this, other) || other is ChapterMessageResponse &&
      other.message == message;

    @override
    int get hashCode =>
        message.hashCode;

  factory ChapterMessageResponse.fromJson(Map<String, dynamic> json) => _$ChapterMessageResponseFromJson(json);

  Map<String, dynamic> toJson() => _$ChapterMessageResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

