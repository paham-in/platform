//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'answer_message_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class AnswerMessageResponse {
  /// Returns a new [AnswerMessageResponse] instance.
  AnswerMessageResponse({

     this.message,
  });

  @JsonKey(
    
    name: r'message',
    required: false,
    includeIfNull: false,
  )


  final String? message;





    @override
    bool operator ==(Object other) => identical(this, other) || other is AnswerMessageResponse &&
      other.message == message;

    @override
    int get hashCode =>
        message.hashCode;

  factory AnswerMessageResponse.fromJson(Map<String, dynamic> json) => _$AnswerMessageResponseFromJson(json);

  Map<String, dynamic> toJson() => _$AnswerMessageResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

