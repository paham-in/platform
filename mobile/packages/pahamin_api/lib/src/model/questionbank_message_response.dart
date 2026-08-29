//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'questionbank_message_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class QuestionbankMessageResponse {
  /// Returns a new [QuestionbankMessageResponse] instance.
  QuestionbankMessageResponse({

     this.message,
  });

  @JsonKey(
    
    name: r'message',
    required: false,
    includeIfNull: false,
  )


  final String? message;





    @override
    bool operator ==(Object other) => identical(this, other) || other is QuestionbankMessageResponse &&
      other.message == message;

    @override
    int get hashCode =>
        message.hashCode;

  factory QuestionbankMessageResponse.fromJson(Map<String, dynamic> json) => _$QuestionbankMessageResponseFromJson(json);

  Map<String, dynamic> toJson() => _$QuestionbankMessageResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

