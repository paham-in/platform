//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'program_message_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class ProgramMessageResponse {
  /// Returns a new [ProgramMessageResponse] instance.
  ProgramMessageResponse({

     this.message,
  });

  @JsonKey(
    
    name: r'message',
    required: false,
    includeIfNull: false,
  )


  final String? message;





    @override
    bool operator ==(Object other) => identical(this, other) || other is ProgramMessageResponse &&
      other.message == message;

    @override
    int get hashCode =>
        message.hashCode;

  factory ProgramMessageResponse.fromJson(Map<String, dynamic> json) => _$ProgramMessageResponseFromJson(json);

  Map<String, dynamic> toJson() => _$ProgramMessageResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

